/**
 * Parser & updater for the decrypted game.sii file.
 * Uses single-pass line scanning for reliable handling of large (5MB+) files.
 */

export interface ParsedGarageData {
  id: string;
  status: number;
  vehicleCount: number;
  vehicleSlots: number;
  driverCount: number;
  driverSlots: number;
  trailers: number;
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
  garages: ParsedGarageData[];
  trucks: ParsedTruckData[];
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
const TRACKED_TYPES = new Set(['bank', 'economy', 'player', 'garage', 'vehicle', 'vehicle_accessory']);

/**
 * Parse the decrypted game.sii content using single-pass line scanning.
 */
export function parseGameData(content: string): ParsedGameData {
  const lines = content.split('\n');

  let money = 0;
  let experiencePoints = 0;
  const skills = { adr: 0, long_dist: 0, heavy: 0, fragile: 0, urgent: 0, mechanical: 0 };
  const garages: ParsedGarageData[] = [];

  // Player data
  let myTruckId = '';
  const playerTruckIds = new Set<string>();

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
        garages.push(curGarage);
        curGarage = null;
      }
      if (blockType === 'vehicle' && curVehicle) {
        vehicles.push(curVehicle);
        curVehicle = null;
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
            curGarage = {
              id: blockId.replace('garage.', ''),
              status: 0, vehicleCount: 0, vehicleSlots: 0,
              driverCount: 0, driverSlots: 0, trailers: 0,
            };
          }
          if (type === 'vehicle') {
            curVehicle = {
              id: blockId,
              firstAccessory: '', licensePlate: '', odometer: 0,
              fuelRelative: 0, engineWear: 0, transmissionWear: 0,
              cabinWear: 0, chassisWear: 0, wheelsWearValues: [], singleWheelsWear: 0,
            };
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
    }

    // ---- Economy ----
    if (blockType === 'economy') {
      if (trimmed.startsWith('experience_points:')) {
        experiencePoints = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      for (const key of ['adr', 'long_dist', 'heavy', 'fragile', 'urgent', 'mechanical'] as const) {
        if (trimmed.startsWith(key + ':') && !trimmed.startsWith(key + '[')) {
          skills[key] = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
        }
      }
    }

    // ---- Player ----
    if (blockType === 'player') {
      if (trimmed.startsWith('my_truck:')) {
        myTruckId = trimmed.split(':')[1].trim();
      }
      const truckMatch = trimmed.match(/^trucks\[\d+\]:\s*(\S+)/);
      if (truckMatch && truckMatch[1] !== 'null') {
        playerTruckIds.add(truckMatch[1]);
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
        if (!trimmed.endsWith('null')) curGarage.vehicleCount++;
      }
      if (trimmed.startsWith('drivers:') && !trimmed.startsWith('drivers[')) {
        curGarage.driverSlots = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
      }
      if (trimmed.startsWith('drivers[')) {
        if (!trimmed.endsWith('null')) curGarage.driverCount++;
      }
      if (trimmed.startsWith('trailers:') && !trimmed.startsWith('trailers[')) {
        curGarage.trailers = parseInt(trimmed.split(':')[1].trim(), 10) || 0;
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

    // ---- Vehicle Accessory ----
    if (blockType === 'vehicle_accessory') {
      if (trimmed.startsWith('data_path:')) {
        const raw = trimmed.substring('data_path:'.length).trim();
        accDataPaths.set(blockId, raw.replace(/^"|"$/g, ''));
      }
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

  return { money, experiencePoints, skills, garages, trucks };
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
  }
): string {
  const lines = content.split('\n');
  const result: string[] = [];

  const hasAnyTruckAction = updates.truckRepairAll || updates.truckRefuelAll ||
    (updates.truckRepairIds && updates.truckRepairIds.length > 0) ||
    (updates.truckRefuelIds && updates.truckRefuelIds.length > 0);

  // Pre-scan: collect player truck IDs if needed
  const playerTruckIds = new Set<string>();
  if (hasAnyTruckAction) {
    let inPlayer = false;
    for (const line of lines) {
      if (!inPlayer && line.startsWith('player : ') && line.endsWith('{')) {
        inPlayer = true;
        continue;
      }
      if (inPlayer && line === '}') break;
      if (inPlayer) {
        const m = line.match(/^\s*trucks\[\d+\]:\s*(\S+)/);
        if (m && m[1] !== 'null') playerTruckIds.add(m[1]);
      }
    }
  }

  // Build per-truck repair/refuel sets
  const repairIds = new Set<string>(updates.truckRepairIds || []);
  const refuelIds = new Set<string>(updates.truckRefuelIds || []);

  let blockType = '';
  let blockId = '';
  let inBlock = false;

  // Garage rebuild state
  let garageRebuild: string[] | null = null;
  let garageTargetStatus = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Block end
    if (line === '}') {
      if (garageRebuild) {
        result.push(garageRebuild[0]);
        for (const gl of garageRebuild.slice(1)) {
          const t = gl.trimStart();
          if (t.startsWith('status:')) {
            result.push(` status: ${garageTargetStatus}`);
          } else if (t.startsWith('vehicles') || t.startsWith('drivers')) {
            // skip
          } else {
            result.push(gl);
          }
        }
        result.push(' vehicles: 5');
        for (let s = 0; s < 5; s++) result.push(` vehicles[${s}]: null`);
        result.push(' drivers: 5');
        for (let s = 0; s < 5; s++) result.push(` drivers[${s}]: null`);
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

    // Block start
    if (!inBlock && line.length > 2 && line.endsWith('{')) {
      const colonIdx = line.indexOf(' : ');
      if (colonIdx > 0) {
        const type = line.substring(0, colonIdx);
        const braceIdx = line.lastIndexOf(' {');
        blockType = type;
        blockId = line.substring(colonIdx + 3, braceIdx);
        inBlock = true;

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

    // Vehicle: repair & refuel (global or per-truck)
    if (blockType === 'vehicle' && playerTruckIds.has(blockId)) {
      const shouldRepair = updates.truckRepairAll || repairIds.has(blockId);
      const shouldRefuel = updates.truckRefuelAll || refuelIds.has(blockId);

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
    }

    result.push(line);
  }

  return result.join('\n');
}
