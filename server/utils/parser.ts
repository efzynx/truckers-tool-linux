/**
 * Purpose: Parser & updater for the decrypted game.sii file.
 * Caller: server/routes/save.ts, server/routes/profiles.ts, server/routes/upload.ts.
 * Dependencies: None (Pure logic).
 * Main Functions: parseGameData, applyUpdates, validateSiiStructure, decodeProfileName.
 * Side Effects: None (Operates on strings/objects in memory).
 */

export interface ParsedGarageData {
  id: string;
  status: number;
  vehicleCount: number;
  vehicleSlots: number;
  driverCount: number;
  driverSlots: number;
  trailers: number;
  trucks: string[];
}

export interface ParsedJobData {
  id: string;
  cargo: string;
  sourceCompany: string;
  targetCompany: string;
  cargoModelIndex: number;
  isCargoMarketJob: boolean;
  startTime: number;
  plannedDistanceKm: number;
  urgency: number;
}

export interface ParsedTruckData {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  odometer: number;
  fuelRelative: number;
  engineWear: number;
  transmissionWear: number;
  cabinWear: number;
  chassisWear: number;
  wheelsWear: number;
  isPlayerTruck: boolean;
}

export interface ParsedDriverData {
  id: string;             // e.g. "driver.127"
  hometown: string;       // e.g. "bremen"
  currentCity: string;    // e.g. "bremen"
  state: number;          // 1=idle, 2=on_job, 3=resting
  onDutyTimer: number;    // rest/duty timer (seconds)
  experiencePoints: number;
  skills: {
    adr: number;
    long_dist: number;
    heavy: number;
    fragile: number;
    urgent: number;
    mechanical: number;
  };
  garageId: string;       // which garage this driver belongs to (filled post-parse)
  assignedTruck: string;  // vehicle ID or "null"
}

export interface ParsedGameData {
  money: number;
  experiencePoints: number;
  skills: {
    adr: number;
    long_dist: number;
    heavy: number;
    fragile: number;
    urgent: number;
    mechanical: number;
  };
  currentJob: ParsedJobData | null;
  garages: ParsedGarageData[];
  trucks: ParsedTruckData[];
  trailers: ParsedTrailerData[];
  drivers: ParsedDriverData[];
  loans: ParsedLoanData[];
  mapDiscovery: {
    visitedCities: number;
    unlockedDealers: number;
    unlockedRecruitments: number;
  };
}

export interface ParsedLoanData {
  id: string;
  amount: number;
  originalAmount: number;
  interestRate: number;
  duration: number;
}

export interface ParsedTrailerData {
  id: string;
  cargoDamage: number;
  bodyWear: number;
  isPrivate: boolean;
  sourceGarage: string | null;
}

/**
 * Mendekode nama folder profil dari format Hexadecimal ke teks biasa (UTF-8).
 * ETS2/ATS menyimpan nama profil sebagai string hex pada nama foldernya.
 */
export function decodeProfileName(folderName: string): string {
  let hex = folderName;
  let isBackup = false;

  if (hex.endsWith('-backup.bak')) {
    hex = hex.replace('-backup.bak', '');
    isBackup = true;
  }

  // Validasi: Pastikan hanya karakter Hex yang didekode
  if (/^[0-9A-Fa-f]+$/.test(hex)) {
    try {
      const decoded = Buffer.from(hex, 'hex').toString('utf8');
      return isBackup ? `${decoded} (Backup)` : decoded;
    } catch (e) {
      return folderName;
    }
  }

  return folderName;
}

function parseHexFloat(val: string): number {
  if (!val) return 0;
  if (val.startsWith('&')) {
    const hex = val.substring(1);
    const int = parseInt(hex, 16);
    if (isNaN(int)) return 0;
    const buffer = new ArrayBuffer(4);
    new Uint32Array(buffer)[0] = int;
    return new Float32Array(buffer)[0];
  }
  return parseFloat(val) || 0;
}

// Targeted block types we care about
const TRACKED_TYPES = new Set(['bank', 'economy', 'player', 'garage', 'vehicle', 'vehicle_accessory', 'driver_ai', 'bank_loan', 'trailer', 'job_info', 'player_job']);

/**
 * Parse the decrypted game.sii content using single-pass line scanning.
 */
export function parseGameData(content: string): ParsedGameData {
  // ---- INTEGRITY CHECK START ----
  const structuralCheck = validateSiiStructure(content);
  if (!structuralCheck.valid) {
    console.error('PARSE INTEGRITY ERROR:', structuralCheck.error);
    throw new Error(`File save rusak: ${structuralCheck.error}`);
  }
  // ---- INTEGRITY CHECK END ----

  // Normalize line endings to avoid \r causing comparison failures
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const lines = normalizedContent.split('\n');

  let money = 0;
  let experiencePoints = 0;
  const skills = { adr: 0, long_dist: 0, heavy: 0, fragile: 0, urgent: 0, mechanical: 0 };
  const garages: ParsedGarageData[] = [];
  const drivers: ParsedDriverData[] = [];
  const driverMap = new Map<string, ParsedDriverData>(); // driver.NNN -> data
  const loans: ParsedLoanData[] = [];
  const loanMap = new Map<string, ParsedLoanData>();    // _nameless -> loan data
  const bankLoanIds = new Set<string>();                // loan IDs from bank block

  let gameTime = 0; // Capture game_time from economy
  let currentJobId = '';
  let parsedCurrentJob: ParsedJobData | null = null;
  const jobInfoMap = new Map<string, ParsedJobData>(); // job_info._nameless -> job data

  // Player data
  let myTruckId = '';
  const playerTruckIds = new Set<string>();
  const playerDriverIds = new Set<string>(); // hired driver IDs from player.drivers[]
  const playerTrailerIds = new Set<string>(); // trailer IDs from player.trailers[]
  let visitedCitiesCount = 0;
  let unlockedDealersCount = 0;
  let unlockedRecruitmentsCount = 0;

  // Vehicle data collection
  interface VehicleRaw {
    id: string;
    firstAccessory: string;
    licensePlate: string;
    odometer: number;
    fuelRelative: number;
    engineWear: number;
    transmissionWear: number;
    cabinWear: number;
    chassisWear: number;
    wheelsWearValues: number[];
    singleWheelsWear: number;
  }
  const vehicles: VehicleRaw[] = [];

  // Accessory data_path map
  const accDataPaths = new Map<string, string>();

  // Current garage data
  let curGarage: ParsedGarageData | null = null;
  let curVehicle: VehicleRaw | null = null;
  let curDriver: ParsedDriverData | null = null;
  let curLoan: ParsedLoanData | null = null;
  // garage slot mapping: track vehicles[] and drivers[] by index to cross-reference
  let curGarageId = '';
  const garageVehicleSlots = new Map<number, string>(); // index -> vehicleId
  const garageDriverSlots = new Map<number, string>(); // index -> driverId
  // Final cross-reference map: driverId -> { truckId, garageId }
  const driverTruckMap = new Map<string, { truckId: string; garageId: string }>();

  // Trailer data mapping
  const parsedTrailers = new Map<string, ParsedTrailerData>();
  const trailerGarageMap = new Map<string, string>(); // trailerId -> garageId

  // Block tracking
  let blockType = '';
  let blockId = '';
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Block end
    if (line === '}') {
      // Finalize current block
      if (blockType === 'garage' && curGarage) {
        // Cross-reference vehicle and driver slots in this garage
        for (const [idx, driverId] of garageDriverSlots) {
          if (driverId !== 'null') {
            const truckId = garageVehicleSlots.get(idx) ?? 'null';
            driverTruckMap.set(driverId, { truckId, garageId: curGarageId });
          }
        }
        garageVehicleSlots.clear();
        garageDriverSlots.clear();
        curGarageId = '';
        garages.push(curGarage);
        curGarage = null;
      }
      if (blockType === 'vehicle' && curVehicle) {
        vehicles.push(curVehicle);
        curVehicle = null;
      }
      if (blockType === 'driver_ai' && curDriver) {
        driverMap.set(curDriver.id, curDriver);
        curDriver = null;
      }
      if (blockType === 'bank_loan' && curLoan) {
        loanMap.set(curLoan.id, curLoan);
        curLoan = null;
      }
      blockType = '';
      blockId = '';
      inBlock = false;
      continue;
    }

    // Block start: detect `type : id {`
    if (!inBlock && line.length > 2 && line[line.length - 1] === '{') {
      const colonIdx = line.indexOf(' : ');
      if (colonIdx > 0) {
        const type = line.substring(0, colonIdx);
        if (TRACKED_TYPES.has(type)) {
          const braceIdx = line.lastIndexOf(' {');
          blockType = type;
          blockId = line.substring(colonIdx + 3, braceIdx);
          inBlock = true;

          if (type === 'garage' && blockId.startsWith('garage.')) {
            curGarageId = blockId.replace('garage.', '');
            curGarage = {
              id: curGarageId,
              status: 0, vehicleCount: 0, vehicleSlots: 0,
              driverCount: 0, driverSlots: 0, trailers: 0, trucks: []
            };
          }
          if (type === 'trailer') {
            parsedTrailers.set(blockId, {
              id: blockId,
              cargoDamage: 0,
              bodyWear: 0,
              isPrivate: false,
              sourceGarage: null
            });
          }
          if (type === 'job_info' || type === 'player_job') {
            jobInfoMap.set(blockId, {
              id: blockId,
              cargo: '',
              sourceCompany: '',
              targetCompany: '',
              cargoModelIndex: 0,
              isCargoMarketJob: false,
              startTime: 0,
              plannedDistanceKm: 0,
              urgency: 0
            });
          }
          if (type === 'vehicle') {
            curVehicle = {
              id: blockId,
              firstAccessory: '', licensePlate: '', odometer: 0,
              fuelRelative: 0, engineWear: 0, transmissionWear: 0,
              cabinWear: 0, chassisWear: 0, wheelsWearValues: [], singleWheelsWear: 0,
            };
          }
          if (type === 'driver_ai' && blockId.startsWith('driver.')) {
            curDriver = {
              id: blockId,
              hometown: '', currentCity: '', state: 1, onDutyTimer: 0,
              experiencePoints: 0, garageId: '',
              assignedTruck: 'null',
              skills: { adr: 0, long_dist: 0, heavy: 0, fragile: 0, urgent: 0, mechanical: 0 },
            };
          }
          if (type === 'bank_loan') {
            curLoan = { id: blockId, amount: 0, originalAmount: 0, interestRate: 0, duration: 0 };
          }
        }
        continue;
      }
    }

    if (!inBlock) continue;

    // Inside a tracked block — extract fields
    const trimmed = line.trimStart();

    // ---- Bank ----
    if (blockType === 'bank') {
      if (trimmed.startsWith('money_account:')) {
        money = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      // collect loan IDs: loans[0]: _nameless.xxx
      const loanMatch = trimmed.match(/^loans\[\d+\]:\s*(\S+)/);
      if (loanMatch && loanMatch[1] !== 'null') {
        bankLoanIds.add(loanMatch[1]);
      }
    } else if (blockType === 'bank_loan' && curLoan) {
      if (trimmed.startsWith('amount:')) {
        curLoan.amount = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('original_amount:')) {
        curLoan.originalAmount = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('interest_rate:')) {
        curLoan.interestRate = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('duration:')) {
        curLoan.duration = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
    } else if (blockType === 'economy') {
      if (trimmed.startsWith('experience_points:')) {
        experiencePoints = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      } else if (trimmed.startsWith('game_time:')) {
        gameTime = parseInt(trimmed.split(':')[1].trim(), 10);
      }
      for (const key of ['adr', 'long_dist', 'heavy', 'fragile', 'urgent', 'mechanical'] as const) {
        if (trimmed.startsWith(key + ':') && !trimmed.startsWith(key + '[')) {
          skills[key] = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
      }
      
      if (trimmed.startsWith('visited_cities:') && !trimmed.startsWith('visited_cities[')) {
        visitedCitiesCount = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('unlocked_dealers:') && !trimmed.startsWith('unlocked_dealers[')) {
        unlockedDealersCount = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('unlocked_recruitments:') && !trimmed.startsWith('unlocked_recruitments[')) {
        unlockedRecruitmentsCount = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
    } else if (blockType === 'player') {
      if (trimmed.startsWith('current_job:')) {
        const jId = trimmed.split(':')[1].trim();
        if (jId !== 'null') currentJobId = jId;
      }
      if (trimmed.startsWith('my_truck:')) {
        myTruckId = trimmed.split(':')[1].trim();
      }
      const truckMatch = trimmed.match(/^trucks\[\d+\]:\s*(\S+)/);
      if (truckMatch && truckMatch[1] !== 'null') {
        playerTruckIds.add(truckMatch[1]);
      }
      const trailerMatch = trimmed.match(/^trailers\[\d+\]:\s*(\S+)/);
      if (trailerMatch && trailerMatch[1] !== 'null') {
        playerTrailerIds.add(trailerMatch[1]);
      }

      // Collect hired driver IDs — drivers[0] is usually the player themselves
      const driverMatch = trimmed.match(/^drivers\[(\d+)\]:\s*(\S+)/);
      if (driverMatch && driverMatch[2] !== 'null') {
        const idx = parseInt(driverMatch[1], 10);
        const driverId = driverMatch[2];
        if (idx === 0) {
          // drivers[0] is the player's own avatar, skip from hired list
        } else {
          playerDriverIds.add(driverId);
        }
      }
    }

    // ---- Garage ----
    if (blockType === 'garage' && curGarage) {
      if (trimmed.startsWith('status:')) {
        curGarage.status = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      // vehicles: N (count header, not array entry)
      if (trimmed.startsWith('vehicles:') && !trimmed.startsWith('vehicles[')) {
        curGarage.vehicleSlots = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('vehicles[')) {
        const vmatch = trimmed.match(/^vehicles\[(\d+)\]:\s*(\S+)/);
        if (vmatch) {
          const vidx = parseInt(vmatch[1], 10);
          const vval = vmatch[2];
          garageVehicleSlots.set(vidx, vval); // save slot->vehicleId
          if (vval !== 'null') {
            curGarage.vehicleCount++;
            curGarage.trucks.push(vval);
          }
        }
      }
      if (trimmed.startsWith('drivers:') && !trimmed.startsWith('drivers[')) {
        curGarage.driverSlots = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('drivers[')) {
        const dmatch = trimmed.match(/^drivers\[(\d+)\]:\s*(\S+)/);
        if (dmatch) {
          const didx = parseInt(dmatch[1], 10);
          const dval = dmatch[2];
          garageDriverSlots.set(didx, dval); // save slot->driverId
          if (dval !== 'null') curGarage.driverCount++;
        }
      }
      if (trimmed.startsWith('trailers:') && !trimmed.startsWith('trailers[')) {
        curGarage.trailers = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('trailers[')) {
        const trMatch = trimmed.match(/^trailers\[\d+\]:\s*(\S+)/);
        if (trMatch && trMatch[1] !== 'null') {
          trailerGarageMap.set(trMatch[1], curGarage.id);
        }
      }
    }

    // ---- Vehicle ----
    if (blockType === 'vehicle' && curVehicle) {
      if (trimmed.startsWith('accessories[0]:')) {
        curVehicle.firstAccessory = trimmed.split(':')[1].trim();
      }
      if (trimmed.startsWith('license_plate:')) {
        const raw = trimmed.substring('license_plate:'.length).trim();
        // Remove quotes, remove |country suffix, strip SCS markup tags
        let plate = raw.replace(/^"|"$/g, '').split('|')[0];
        // Strip all <tag ...> and </tag> markup (ETS2 internal formatting)
        plate = plate.replace(/<[^>]+>/g, '');
        // Clean whitespace
        plate = plate.replace(/\s+/g, ' ').trim();
        curVehicle.licensePlate = plate;
      }
      if (trimmed.startsWith('odometer:') && !trimmed.startsWith('odometer_')) {
        curVehicle.odometer = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('fuel_relative:')) {
        curVehicle.fuelRelative = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('engine_wear:') && !trimmed.startsWith('engine_wear_un')) {
        curVehicle.engineWear = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('transmission_wear:') && !trimmed.startsWith('transmission_wear_un')) {
        curVehicle.transmissionWear = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('cabin_wear:') && !trimmed.startsWith('cabin_wear_un')) {
        curVehicle.cabinWear = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('chassis_wear:') && !trimmed.startsWith('chassis_wear_un')) {
        curVehicle.chassisWear = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('wheels_wear[')) {
        curVehicle.wheelsWearValues.push(parseHexFloat(trimmed.split(':')[1].trim()));
      }
      if (trimmed.startsWith('wheels_wear:') && !trimmed.startsWith('wheels_wear_un') && !trimmed.startsWith('wheels_wear[')) {
        const val = trimmed.split(':')[1].trim();
        // Could be count (integer) or a hex float wear value
        const num = parseInt(val, 10);
        if (val.startsWith('&') || (num > 1 && val.includes('.'))) {
          curVehicle.singleWheelsWear = parseHexFloat(val);
        }
        // If it's just a count (like "0" or "6"), it means array format
      }
    }

    // ---- Trailer ----
    if (blockType === 'trailer' && parsedTrailers.has(blockId)) {
      const t = parsedTrailers.get(blockId)!;
      if (trimmed.startsWith('cargo_damage:')) {
        t.cargoDamage = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('trailer_body_wear:') && !trimmed.startsWith('trailer_body_wear_unfixable')) {
        t.bodyWear = parseHexFloat(trimmed.split(':')[1].trim());
      }
      if (trimmed.startsWith('is_private:')) {
        t.isPrivate = trimmed.split(':')[1].trim() === 'true';
      }
    }

    // ---- Vehicle Accessory ----
    if (blockType === 'vehicle_accessory') {
      if (trimmed.startsWith('data_path:')) {
        const raw = trimmed.substring('data_path:'.length).trim();
        accDataPaths.set(blockId, raw.replace(/^"|"$/g, ''));
      }
    }

    // ---- Driver AI ----
    if (blockType === 'driver_ai' && curDriver) {
      for (const key of ['adr', 'long_dist', 'heavy', 'fragile', 'urgent', 'mechanical'] as const) {
        if (trimmed.startsWith(key + ':') && !trimmed.startsWith(key + '[')) {
          curDriver.skills[key] = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
      }
      if (trimmed.startsWith('hometown:')) {
        curDriver.hometown = trimmed.split(':')[1].trim();
      }
      if (trimmed.startsWith('current_city:')) {
        curDriver.currentCity = trimmed.split(':')[1].trim();
      }
      if (trimmed.startsWith('state:')) {
        curDriver.state = parseInt(trimmed.split(':')[1].trim(), 10) || 1;
      }
      if (trimmed.startsWith('on_duty_timer:')) {
        curDriver.onDutyTimer = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('experience_points:')) {
        curDriver.experiencePoints = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('assigned_truck:')) {
        curDriver.assignedTruck = trimmed.split(':')[1].trim();
      }
    }

    // ---- job_info / player_job (keduanya format sama) ----
    if ((blockType === 'job_info' || blockType === 'player_job')) {
      const j = jobInfoMap.get(blockId);
      if (j) {
        if (trimmed.startsWith('cargo:')) {
          j.cargo = trimmed.split(':')[1].trim();
        }
        if (trimmed.startsWith('source_company:')) {
          j.sourceCompany = trimmed.split(':')[1].trim();
        }
        if (trimmed.startsWith('target_company:')) {
          j.targetCompany = trimmed.split(':')[1].trim();
        }
        if (trimmed.startsWith('cargo_model_index:')) {
          j.cargoModelIndex = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
        if (trimmed.startsWith('is_cargo_market_job:')) {
          j.isCargoMarketJob = trimmed.split(':')[1].trim() === 'true';
        }
        if (trimmed.startsWith('start_time:')) {
          j.startTime = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
        if (trimmed.startsWith('planned_distance_km:')) {
          j.plannedDistanceKm = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
        if (trimmed.startsWith('urgency:')) {
          j.urgency = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
      }
    }
  } // end of main for loop

  // ---- Build hired driver list — only from player.drivers[] (skip drivers[0] = player) ----
  for (const driverId of playerDriverIds) {
    const d = driverMap.get(driverId);
    if (d) {
      // Patch assignedTruck and garageId from garage slot cross-reference
      const slotInfo = driverTruckMap.get(driverId);
      if (slotInfo) {
        d.assignedTruck = slotInfo.truckId;
        d.garageId = slotInfo.garageId;
      }
      drivers.push(d);
    }
  }

  // ---- Build truck list ----
  const trucks: ParsedTruckData[] = [];
  for (const v of vehicles) {
    if (!playerTruckIds.has(v.id)) continue;

    let brand = 'unknown';
    let model = 'unknown';
    if (v.firstAccessory) {
      const dataPath = accDataPaths.get(v.firstAccessory);
      if (dataPath) {
        const m = dataPath.match(/\/def\/vehicle\/truck\/([^/]+)\//);
        if (m) {
          const parts = m[1].split('.');
          brand = parts[0] || 'unknown';
          model = parts.slice(1).join('.') || 'unknown';
        }
      }
    }

    let wheelsWear = v.singleWheelsWear;
    if (v.wheelsWearValues.length > 0) {
      wheelsWear = v.wheelsWearValues.reduce((s, w) => s + w, 0) / v.wheelsWearValues.length;
    }

    trucks.push({
      id: v.id,
      brand,
      model,
      licensePlate: v.licensePlate,
      odometer: v.odometer,
      fuelRelative: v.fuelRelative,
      engineWear: v.engineWear,
      transmissionWear: v.transmissionWear,
      cabinWear: v.cabinWear,
      chassisWear: v.chassisWear,
      wheelsWear,
      isPlayerTruck: v.id === myTruckId,
    });
  }

  // ---- Build bank loans list ----
  for (const loanId of bankLoanIds) {
    const l = loanMap.get(loanId);
    if (l) loans.push(l);
  }

  // ---- Build trailers list ----
  const trailers: ParsedTrailerData[] = [];
  for (const tId of playerTrailerIds) {
    const t = parsedTrailers.get(tId);
    if (t) {
      t.sourceGarage = trailerGarageMap.get(tId) || null;
      trailers.push(t);
    }
  }
  
  if (currentJobId && currentJobId !== 'null') {
    parsedCurrentJob = jobInfoMap.get(currentJobId) || null;
  }

  return { money, experiencePoints, skills, currentJob: parsedCurrentJob, garages, trucks, trailers, drivers, loans, mapDiscovery: { visitedCities: visitedCitiesCount, unlockedDealers: unlockedDealersCount, unlockedRecruitments: unlockedRecruitmentsCount } };
}

/**
 * Validates the basic structural integrity of an SII file content.
 */
export function validateSiiStructure(content: string): { valid: boolean; error?: string } {
  let openBraces = 0;
  let closeBraces = 0;
  
  // Quick count using regex is faster for large files
  const openMatches = content.match(/\{/g);
  const closeMatches = content.match(/\}/g);
  
  openBraces = openMatches ? openMatches.length : 0;
  closeBraces = closeMatches ? closeMatches.length : 0;

  if (openBraces !== closeBraces) {
    return { 
      valid: false, 
      error: `Mismatched braces: found ${openBraces} '{' and ${closeBraces} '}'. Structure is corrupted.` 
    };
  }

  // Check if it starts with the expected header (SiiNunit)
  if (!content.trimStart().startsWith('SiiNunit')) {
    return { valid: false, error: 'Invalid SII header: Missing SiiNunit declaration.' };
  }

  return { valid: true };
}

/**
 * Apply updates to the game.sii content using single-pass line scanning.
 */
export function applyUpdates(
  content: string,
  updates: {
    money?: number;
    experiencePoints?: number;
    skills?: {
      adr?: number;
      long_dist?: number;
      heavy?: number;
      fragile?: number;
      urgent?: number;
      mechanical?: number;
    };
    targetGarages?: Record<string, number>;
    truckRepairAll?: boolean;
    truckRefuelAll?: boolean;
    truckRepairIds?: string[];
    truckRefuelIds?: string[];
    trailerRepairAll?: boolean;
    trailerRepairIds?: string[];
    discoverMap?: boolean;
    clearLoans?: boolean;
    economyReset?: boolean;
    customLicensePlates?: { id: string; plate: string }[];
    resetJobTime?: boolean;
  }
): string {
  // Normalize line endings to avoid \r causing comparison failures
  const isWindows = content.includes('\r\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const lines = normalizedContent.split('\n');
  const result: string[] = [];

  const hasAnyTruckAction = updates.truckRepairAll || updates.truckRefuelAll ||
    (updates.truckRepairIds && updates.truckRepairIds.length > 0) ||
    (updates.truckRefuelIds && updates.truckRefuelIds.length > 0) ||
    (updates.customLicensePlates && updates.customLicensePlates.length > 0);

  // Pre-scan: collect player truck IDs if needed
  const playerTruckIds = new Set<string>();
  let gameTimeValue = 0; // Pre-scan game_time for resetting job
  let currentJobId = '';

  if (hasAnyTruckAction || updates.resetJobTime) {
    let inPlayer = false;
    let inEconomy = false;
    for (const line of lines) {
      if (line.startsWith('player : ') && line.endsWith('{')) {
        inPlayer = true;
        continue;
      }
      if (line.startsWith('economy : ') && line.endsWith('{')) {
        inEconomy = true;
        continue;
      }
      if ((inPlayer || inEconomy) && line === '}') {
        inPlayer = false;
        inEconomy = false;
        continue;
      }
      if (inPlayer) {
        const m = line.match(/^\s*trucks\[\d+\]:\s*(\S+)/);
        if (m && m[1] !== 'null') playerTruckIds.add(m[1]);

        if (line.trimStart().startsWith('current_job:')) {
            const jId = line.trimStart().split(':')[1].trim();
            if (jId !== 'null') currentJobId = jId;
        }
      }
      if (inEconomy) {
          if (line.trimStart().startsWith('game_time:')) {
            gameTimeValue = parseInt(line.trimStart().split(':')[1].trim(), 10);
          }
      }
    }
  }

  // Build per-truck and per-trailer repair/refuel/plate sets
  const repairIds = new Set<string>(updates.truckRepairIds || []);
  const refuelIds = new Set<string>(updates.truckRefuelIds || []);
  const trailerRepairIds = new Set<string>(updates.trailerRepairIds || []);
  const customPlatesMap = new Map<string, string>();
  if (updates.customLicensePlates) {
    for (const cp of updates.customLicensePlates) {
      customPlatesMap.set(cp.id, cp.plate);
    }
  }

  const hasAnyTrailerAction = updates.trailerRepairAll || trailerRepairIds.size > 0;

  // Track map discovery to inject count modifications

  let blockType = '';
  let blockId = '';
  let inBlock = false;
  let inLoanBlock = false; // to skip entire bank_loan blocks when clearLoans=true

  // Garage rebuild state
  let garageRebuild: string[] | null = null;
  let garageTargetStatus = 0;
  // Map discovery: kumpulkan kota visited secara terpisah (terpisah dari garageRebuild!)
  let citiesList: string[] | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Block end
    if (line === '}') {
      if (inLoanBlock) {
        // skip the closing brace of loan block too
        inLoanBlock = false;
        continue;
      }
      if (garageRebuild) {
        result.push(garageRebuild[0]);
        const existingVehicles: string[] = [];
        const existingDrivers: string[] = [];
        
        // Pass 1: extract all existing items using their explicit index
        for (const gl of garageRebuild.slice(1)) {
          const t = gl.trimStart();
          if (t.startsWith('vehicles[')) {
            const m = t.match(/^vehicles\[(\d+)\]:\s*(\S+)/);
            if (m) existingVehicles[parseInt(m[1], 10)] = m[2];
          } else if (t.startsWith('drivers[')) {
            const m = t.match(/^drivers\[(\d+)\]:\s*(\S+)/);
            if (m) existingDrivers[parseInt(m[1], 10)] = m[2];
          }
        }
        
        // Calculate new slots size safely
        const targetSlots = Math.max(
            existingVehicles.length, 
            existingDrivers.length, 
            garageTargetStatus >= 3 ? 5 : garageTargetStatus === 2 ? 3 : garageTargetStatus === 1 ? 3 : 0
        );

        // Pass 2: rebuild in exact order
        for (const gl of garageRebuild.slice(1)) {
          const t = gl.trimStart();
          
          if (t.startsWith('status:')) {
            result.push(` status: ${garageTargetStatus}`);
            continue;
          }
          
          if (t.startsWith('vehicles:')) {
            result.push(` vehicles: ${targetSlots}`);
            // immediately output all vehicle slots
            for (let s = 0; s < targetSlots; s++) {
              const val = existingVehicles[s] && existingVehicles[s] !== 'null' ? existingVehicles[s] : 'null';
              result.push(` vehicles[${s}]: ${val}`);
            }
            continue;
          }

          if (t.startsWith('drivers:')) {
            result.push(` drivers: ${targetSlots}`);
            // immediately output all driver slots
            for (let s = 0; s < targetSlots; s++) {
              const val = existingDrivers[s] && existingDrivers[s] !== 'null' ? existingDrivers[s] : 'null';
              result.push(` drivers[${s}]: ${val}`);
            }
            continue;
          }

          if (t.startsWith('vehicles[') || t.startsWith('drivers[')) {
            // skip because we already injected them above
            continue;
          }

          result.push(gl);
        }
        
        result.push('}');
        garageRebuild = null;
      } else {
        result.push(line);
      }
      blockType = '';
      blockId = '';
      inBlock = false;
      continue;
    }

    // Skip lines inside a loan block (clearLoans)
    if (inLoanBlock) continue;

    // Block start
    if (!inBlock && line.length > 2 && line.endsWith('{')) {
      const colonIdx = line.indexOf(' : ');
      if (colonIdx > 0) {
        const type = line.substring(0, colonIdx);
        const braceIdx = line.lastIndexOf(' {');
        blockType = type;
        blockId = line.substring(colonIdx + 3, braceIdx);
        inBlock = true;

        // Skip whole bank_loan block when clearLoans=true
        if (type === 'bank_loan' && updates.clearLoans) {
          inLoanBlock = true;
          inBlock = false;
          blockType = '';
          blockId = '';
          continue;
        }

        if (type === 'garage' && blockId.startsWith('garage.') && updates.targetGarages) {
          const cityId = blockId.replace('garage.', '');
          const target = updates.targetGarages[cityId];
          if (target !== undefined && target > 0) {
            garageRebuild = [line];
            garageTargetStatus = target;
            continue;
          }
        }
      }
    }

    if (garageRebuild) {
      garageRebuild.push(line);
      continue;
    }

    if (!inBlock) {
      result.push(line);
      continue;
    }

    const trimmed = line.trimStart();

    // Bank: money
    if (blockType === 'bank' && updates.money !== undefined && trimmed.startsWith('money_account:')) {
      result.push(line.replace(/money_account:\s*\S+/, `money_account: ${updates.money}`));
      continue;
    }
    // Bank: clear loans — reset count and skip individual loan[N] entries
    if (blockType === 'bank' && updates.clearLoans) {
      if (trimmed.startsWith('loans:') && !trimmed.startsWith('loans[')) {
        result.push(line.replace(/loans:\s*\S+/, 'loans: 0'));
        continue;
      }
      if (trimmed.startsWith('loans[')) {
        // skip loan[N]: _nameless.xxx lines
        continue;
      }
    }

    // Economy: Economy Reset via game_time & Map area
    if (blockType === 'economy' && updates.economyReset) {
      if (trimmed.startsWith('game_time:')) {
        const val = parseInt(trimmed.split(':')[1].trim(), 10);
        if (!isNaN(val)) {
          // Add 5000 mins (~3.5 days) to expire jobs
          result.push(line.replace(/game_time:\s*\d+/, `game_time: ${val + 5000}`));
          continue;
        }
      }
    }

    // Economy: Map Discovery
    if (blockType === 'economy' && updates.discoverMap) {
      // Kumpulkan semua kota dari visited_cities[] ke citiesList (terpisah dari garageRebuild)
      if (trimmed.startsWith('visited_cities:') && !trimmed.startsWith('visited_cities[')) {
        // Skip header count — akan ditulis ulang bersama unlocked_dealers di bawah
        continue;
      }
      if (trimmed.startsWith('visited_cities[')) {
        const cityMatch = trimmed.match(/^visited_cities\[\d+\]:\s*(\S+)/);
        if (cityMatch && cityMatch[2] && cityMatch[2] !== 'null') {
          if (!citiesList) citiesList = [];
          citiesList.push(cityMatch[2]);
        } else if (cityMatch && cityMatch[1] && cityMatch[1] !== 'null') {
          // fallback: index 1 jika regex punya 2 grup
          if (!citiesList) citiesList = [];
          citiesList.push(cityMatch[1]);
        }
        // Skip line ini — akan ditulis ulang seluruhnya bersama unlocked_dealers
        continue;
      }

      // Saat menemukan unlocked_dealers, tulis visited_cities + unlocked_dealers sekaligus
      if (trimmed.startsWith('unlocked_dealers:') && !trimmed.startsWith('unlocked_dealers[')) {
        const cities = citiesList || [];
        // Tulis ulang visited_cities header + array
        result.push(` visited_cities: ${cities.length}`);
        for (let idx = 0; idx < cities.length; idx++) {
          result.push(` visited_cities[${idx}]: ${cities[idx]}`);
        }
        // Tulis unlocked_dealers (sama dengan visited cities)
        result.push(` unlocked_dealers: ${cities.length}`);
        for (let idx = 0; idx < cities.length; idx++) {
          result.push(` unlocked_dealers[${idx}]: ${cities[idx]}`);
        }
        continue;
      }
      if (trimmed.startsWith('unlocked_dealers[')) {
        // Skip — sudah ditulis di atas
        continue;
      }

      // Rewrite unlocked_recruitments
      if (trimmed.startsWith('unlocked_recruitments:') && !trimmed.startsWith('unlocked_recruitments[')) {
        const cities = citiesList || [];
        result.push(` unlocked_recruitments: ${cities.length}`);
        for (let idx = 0; idx < cities.length; idx++) {
          result.push(` unlocked_recruitments[${idx}]: ${cities[idx]}`);
        }
        continue;
      }
      if (trimmed.startsWith('unlocked_recruitments[')) {
        continue;
      }
      
      // Override visited_cities_count to 3 (visited)
      if (trimmed.startsWith('visited_cities_count[')) {
        const colonPos = line.indexOf(':');
        result.push(line.substring(0, colonPos + 1) + ' 3');
        continue;
      }
    }

    // Economy: XP
    if (blockType === 'economy' && updates.experiencePoints !== undefined && trimmed.startsWith('experience_points:')) {
      result.push(line.replace(/experience_points:\s*\S+/, `experience_points: ${updates.experiencePoints}`));
      continue;
    }

    // Economy: skills
    if (blockType === 'economy' && updates.skills) {
      let handled = false;
      for (const key of ['adr', 'long_dist', 'heavy', 'fragile', 'urgent', 'mechanical'] as const) {
        if (updates.skills[key] !== undefined && trimmed.startsWith(key + ':') && !trimmed.startsWith(key + '[')) {
          result.push(line.replace(new RegExp(`${key}:\\s*\\d+`), `${key}: ${updates.skills[key]}`));
          handled = true;
          break;
        }
      }
      if (handled) continue;
    }

    // Vehicle: repair & refuel (global or per-truck) & custom plate
    if (blockType === 'vehicle' && playerTruckIds.has(blockId)) {
      const shouldRepair = updates.truckRepairAll || repairIds.has(blockId);
      const shouldRefuel = updates.truckRefuelAll || refuelIds.has(blockId);
      const newCustomPlate = customPlatesMap.get(blockId);

      if (shouldRepair) {
        const wearFields = ['engine_wear:', 'transmission_wear:', 'cabin_wear:', 'chassis_wear:',
          'engine_wear_unfixable:', 'transmission_wear_unfixable:', 'cabin_wear_unfixable:', 'chassis_wear_unfixable:'];
        const isWear = wearFields.some(f => trimmed.startsWith(f) && !trimmed.startsWith(f.replace(':', '[')));
        if (isWear) {
          const colonPos = line.indexOf(':');
          result.push(line.substring(0, colonPos + 1) + ' 0');
          continue;
        }
        if (trimmed.startsWith('wheels_wear[') || trimmed.startsWith('wheels_wear_unfixable[')) {
          const colonPos = line.indexOf(':');
          result.push(line.substring(0, colonPos + 1) + ' 0');
          continue;
        }
      }
      if (shouldRefuel && trimmed.startsWith('fuel_relative:')) {
        const colonPos = line.indexOf(':');
        result.push(line.substring(0, colonPos + 1) + ' 1');
        continue;
      }
      if (newCustomPlate && trimmed.startsWith('license_plate:')) {
        const prevCountryMatch = trimmed.match(/\|([^"]+)"/);
        const country = prevCountryMatch ? prevCountryMatch[1] : 'germany';
        result.push(` license_plate: "${newCustomPlate}|${country}"`);
        continue;
      }
    }

    // Trailer: repair
    if (blockType === 'trailer' && hasAnyTrailerAction && (updates.trailerRepairAll || trailerRepairIds.has(blockId))) {
      if (trimmed.startsWith('cargo_damage:') || trimmed.startsWith('trailer_body_wear:') || trimmed.startsWith('trailer_body_wear_unfixable:')) {
        const colonPos = line.indexOf(':');
        result.push(line.substring(0, colonPos + 1) + ' 0');
        continue;
      }
    }

    // Job Reset Time
    if ((blockType === 'job_info' || blockType === 'player_job') && updates.resetJobTime && blockId === currentJobId) {
        if (trimmed.startsWith('start_time:')) {
            const colonPos = line.indexOf(':');
            result.push(line.substring(0, colonPos + 1) + ' ' + gameTimeValue);
            continue;
        }
    }

    result.push(line);
  }

  const updatedContent = result.join(isWindows ? '\r\n' : '\n');

  // ---- INTEGRITY CHECK START ----
  
  // 1. Basic Structure Validation (Braces)
  const structuralCheck = validateSiiStructure(updatedContent);
  if (!structuralCheck.valid) {
    console.error('INTEGRITY ERROR:', structuralCheck.error);
    throw new Error(structuralCheck.error);
  }

  // 2. Dry Run Re-Parsing
  // We try to parse the updated content. If our own parser fails, 
  // it means we produced something that violates the expected format.
  try {
    parseGameData(updatedContent);
  } catch (err) {
    console.error('DRY-RUN PARSE ERROR:', err);
    throw new Error('Integritas data gagal: Hasil modifikasi tidak dapat diproses ulang oleh parser. Simpan dibatalkan.');
  }

  // ---- INTEGRITY CHECK END ----

  return updatedContent;
}

