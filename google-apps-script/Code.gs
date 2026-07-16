/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Epyllion Knitex Ltd. - Knitting Performance System
 * Google Apps Script ERP REST API Backend (Code.gs)
 * 
 * This file acts as the complete REST API backend. It uses Google Sheets as a data store
 * and performs all calculations, filtering, permission checks, and data validations
 * directly inside the Apps Script execution runtime.
 * 
 * Sheet structures used as tables:
 * 1. "Production_Data"
 * 2. "Users"
 * 3. "Settings"
 * 4. "Activity_Log"
 */

// ==========================================================
// CONFIGURATION & GLOBAL CONSTANTS
// ==========================================================
const VERSION = "1.0.0";
const SECRET_TOKEN_SALT = "EpyllionKnitexERP_Secret_Salt_2026";

// ==========================================================
// WEB APP ROUTING HOOKS (GET & POST)
// ==========================================================

/**
 * Handles all HTTP GET requests.
 * Routes based on the 'action' query parameter.
 */
function doGet(e) {
  try {
    // Enable CORS by permitting any origin
    const origin = "*";
    const action = e.parameter.action;
    
    if (!action) {
      return makeResponse({
        success: false,
        message: "Action parameter is missing. Please specify an action."
      });
    }

    // Auto-bootstrap sheets if they do not exist
    initializeDatabase();

    // Route requests
    switch (action) {
      case "production/list":
        return handleGetProductionList(e);
      case "production/details":
        return handleGetProductionDetails(e);
      case "ledger/list":
        return handleGetLedgerList(e);
      case "dashboard/factory":
        return handleGetDashboardFactory(e);
      case "dashboard/floor":
        return handleGetDashboardFloor(e);
      case "users":
        return handleGetUsers(e);
      case "activity":
        return handleGetActivityLog(e);
      case "settings":
        return handleGetSettings(e);
      case "health":
        return makeResponse({
          success: true,
          message: "Epyllion Knitting Performance System API is online.",
          version: VERSION
        });
      default:
        return makeResponse({
          success: false,
          message: "Invalid action or endpoint: " + action
        });
    }
  } catch (error) {
    return makeResponse({
      success: false,
      message: "Server Error: " + error.toString()
    });
  }
}

/**
 * Handles all HTTP POST requests.
 * Parses the POST payload and routes based on the 'action' parameter.
 */
function doPost(e) {
  try {
    // Auto-bootstrap sheets if they do not exist
    initializeDatabase();

    let postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (ex) {
        return makeResponse({
          success: false,
          message: "Malformed JSON post body: " + ex.toString()
        });
      }
    }

    const action = postData.action || e.parameter.action;
    if (!action) {
      return makeResponse({
        success: false,
        message: "Action parameter is missing in route request."
      });
    }

    // Route POST actions
    switch (action) {
      case "login":
        return handleLogin(postData);
      case "production/add":
        return handleAddProduction(postData);
      case "production/update":
        return handleUpdateProduction(postData);
      case "production/delete":
        return handleDeleteProduction(postData);
      case "ledger/add":
        return handleAddLedgerEntry(postData);
      case "ledger/update":
        return handleUpdateLedgerEntry(postData);
      case "ledger/delete":
        return handleDeleteLedgerEntry(postData);
      case "users/add":
        return handleAddUser(postData);
      case "users/update":
        return handleUpdateUser(postData);
      case "users/delete":
        return handleDeleteUser(postData);
      case "settings/update":
        return handleUpdateSettings(postData);
      default:
        return makeResponse({
          success: false,
          message: "Invalid POST action or endpoint: " + action
        });
    }
  } catch (error) {
    return makeResponse({
      success: false,
      message: "Server POST Error: " + error.toString()
    });
  }
}

/**
 * Creates an HTTP-compatible TextOutput containing the stringified JSON data.
 * This is crucial for cross-domain client requests (CORS).
 */
function makeResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================================
// DATABASE SETUP & AUTO-BOOTSTRAP MODULE
// ==========================================================

/**
 * Verifies that the necessary sheets are initialized.
 * If any sheets are missing, it creates them with required headers
 * and populates default configuration or seed users.
 */
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Users sheet
  let usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    const headers = [
      "userName", "userType", "designation", "uid", "password", 
      "department", "assignedUnit", "permission", "status", "createdDate", "updatedDate", "allowedTabs"
    ];
    usersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Seed default administrator
    const seedAdmin = [
      "Md. Raihan Hossain Antu", "Admin", "Sr. Production Manager", "EKL001", "password123",
      "Knitting", "EKL, EFL, EFL-2, Auto Stripe, EFL-Extension, ESL-Extension", "Read / Write", "Active",
      new Date().toISOString(), new Date().toISOString(), 
      "Dashboard, Production Ledger, Floor Dashboard, Management Dashboard, Reports, User Management, Settings"
    ];
    const seedUser = [
      "Kazi Mahmud", "General", "Production Officer", "EKL002", "password456",
      "Knitting", "EKL, EFL, EFL-2", "Read", "Active",
      new Date().toISOString(), new Date().toISOString(), 
      "Dashboard, Production Ledger, Floor Dashboard, Management Dashboard, Reports, Settings"
    ];
    usersSheet.appendRow(seedAdmin);
    usersSheet.appendRow(seedUser);
    
    logActivityInternal("SYSTEM", "Created 'Users' database table & seeded default accounts.");
  }

  // 2. Production_Data sheet
  let prodSheet = ss.getSheetByName("Production_Data");
  if (!prodSheet) {
    prodSheet = ss.insertSheet("Production_Data");
    const headers = [
      "id", "floorId", "timestamp", "machineId", "operatorName", "shift", 
      "yarnType", "fabricType", "productionKg", "rejectKg", "remarks", 
      "holdKg", "activeMachines", "totalMachines", "needlesConsumed", "oilConsumed", "date"
    ];
    prodSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Seed initial entries for testing
    const seedEntries = [
      [
        "ent-1", "ekl", "21:24", "M-01", "Akil Zaman", "C", 
        "30s Cotton Combed", "Single Jersey", 180.0, 1.5, "Stitch length verified.", 
        0, 45, 48, 5, 4, getRelativeDateString(0)
      ],
      [
        "ent-2", "efl", "21:05", "M-05", "Nasrin Akhter", "C", 
        "34s Cotton Combed", "1x1 Rib", 175.4, 2.1, "Grey scale test passed.", 
        10, 38, 40, 2, 3, getRelativeDateString(0)
      ],
      [
        "ent-3", "efl-2", "20:45", "M-03", "Kamal Hossain", "B", 
        "40s Cotton Combed", "Interlock", 190.2, 3.5, "Yarn tension stabilized.", 
        0, 29, 35, 12, 5, getRelativeDateString(1)
      ],
      [
        "ent-4", "auto-stripe", "20:10", "M-07", "Rashedul Bari", "B", 
        "50D Lycra", "Fleece", 210.0, 1.2, "Stripe alignment ok.", 
        15, 18, 20, 0, 2, getRelativeDateString(1)
      ],
      [
        "ent-5", "efl-ext", "19:30", "M-02", "Taslima Begum", "B", 
        "30s Grey Melange", "Pique", 145.0, 4.8, "Awaiting motor calibration.", 
        50, 17, 25, 20, 8, getRelativeDateString(2)
      ]
    ];
    
    for (let i = 0; i < seedEntries.length; i++) {
      prodSheet.appendRow(seedEntries[i]);
    }
    
    logActivityInternal("SYSTEM", "Created 'Production_Data' database table & seeded baseline records.");
  }

  // 3. Settings sheet
  let settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("Settings");
    const headers = ["key", "value"];
    settingsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Seed settings keys
    const seedSettings = [
      ["setting_rejectThreshold", "2.5"],
      ["setting_maxIdleMachines", "4"],
      ["setting_alarmEmail", "knitprod-alerts@epyllion.com"],
      ["target_capacity_EKL", "7500"],
      ["target_capacity_EFL", "15000"],
      ["target_capacity_EFL-2", "15000"],
      ["target_capacity_Auto Stripe", "12000"],
      ["target_capacity_EFL-Extension", "15000"],
      ["target_capacity_ESL-Extension", "10000"],
      ["total_machines_EKL", "48"],
      ["total_machines_EFL", "40"],
      ["total_machines_EFL-2", "35"],
      ["total_machines_Auto Stripe", "20"],
      ["total_machines_EFL-Extension", "25"],
      ["total_machines_ESL-Extension", "16"]
    ];
    
    for (let i = 0; i < seedSettings.length; i++) {
      settingsSheet.appendRow(seedSettings[i]);
    }
    
    logActivityInternal("SYSTEM", "Created 'Settings' database table & populated default values.");
  }

  // 4. Activity_Log sheet
  let logSheet = ss.getSheetByName("Activity_Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Activity_Log");
    const headers = ["id", "timestamp", "floorId", "type", "message", "status", "uid"];
    logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    logActivityInternal("SYSTEM", "Created 'Activity_Log' database table.");
  }

  // 5. Production_Ledger sheet
  let ledgerSheet = ss.getSheetByName("Production_Ledger");
  if (!ledgerSheet) {
    ledgerSheet = ss.insertSheet("Production_Ledger");
    const headers = [
      "id", "date", "floor", "month", "year", "target", "shiftA", "shiftB", "shiftC", "totalProduction", 
      "runningMachine", "idleMachine", "machineUtilization", "idleMachinePct", "idleProduction", "efficiency", "productionPerMachine", 
      "reject", "rejectPct", "hold", "holdPct", "needleBroken", "needlePerKg", "sinkerBroken", "oilConsumption", 
      "productionLossForEfficiency", "capacityUtilization", "totalOperator", "absent", "absentPct", "setChange", "remarks",
      "productionFlatKnit", "yarnIssued", "runningFactories", "fabricReturn"
    ];
    ledgerSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Seed historical ledger rows from 13th of July backwards to 1st of July so it matches frontend expectations
    const floorsData = [
      { name: 'EKL', target: 7500, machines: 48, operators: 110 },
      { name: 'EFL', target: 15000, machines: 40, operators: 95 },
      { name: 'EFL-2', target: 15000, machines: 35, operators: 85 },
      { name: 'Auto Stripe', target: 12000, machines: 20, operators: 50 },
      { name: 'EFL-Extension', target: 15000, machines: 25, operators: 65 },
      { name: 'ESL-Extension', target: 10000, machines: 16, operators: 40 }
    ];

    for (let day = 13; day >= 1; day--) {
      const dayStr = day < 10 ? "0" + day : "" + day;
      const dateStr = "2026-07-" + dayStr;
      const seed = day * 3.5;

      floorsData.forEach(function(floor, idx) {
        const targetVariation = Math.round((1 + Math.sin(seed + idx) * 0.04) * floor.target);
        const isEFLExtCritical = floor.name === 'EFL-Extension' && day === 10;
        const factor = isEFLExtCritical ? 0.65 : (0.92 + Math.cos(seed - idx) * 0.05);

        const totalProduction = Math.round(targetVariation * factor);
        const shiftA = Math.round(totalProduction * 0.35);
        const shiftB = Math.round(totalProduction * 0.35);
        const shiftC = totalProduction - shiftA - shiftB;

        const runningMachine = isEFLExtCritical ? 15 : Math.round(floor.machines * (0.85 + Math.sin(seed) * 0.06));
        const idleMachine = floor.machines - runningMachine;
        const machineUtilization = parseFloat(((runningMachine / floor.machines) * 100).toFixed(1));
        const idleMachinePct = parseFloat(((idleMachine / floor.machines) * 100).toFixed(1));
        const idleProduction = idleMachine * 260;

        const efficiency = parseFloat(((totalProduction / targetVariation) * 100).toFixed(1));
        const productionPerMachine = parseFloat((totalProduction / (runningMachine || 1)).toFixed(1));

        const reject = Math.round(totalProduction * (0.012 + Math.sin(seed + idx) * 0.005));
        const rejectPct = parseFloat(((reject / totalProduction) * 100).toFixed(2));
        const hold = Math.round(totalProduction * (0.015 + Math.cos(seed) * 0.007));
        const holdPct = parseFloat(((hold / totalProduction) * 100).toFixed(2));

        const needleBroken = Math.round(8 + Math.sin(seed * 1.5) * 3 + idx * 2);
        const needlePerKg = parseFloat((needleBroken / totalProduction).toFixed(5));
        const sinkerBroken = Math.round(4 + Math.cos(seed) * 1.5 + idx);
        const oilConsumption = Math.round(15 + Math.sin(seed) * 2 + idx * 2);

        const productionLossForEfficiency = Math.max(0, targetVariation - totalProduction);
        const capacityUtilization = parseFloat(((runningMachine / floor.machines) * 100).toFixed(1));

        const absent = Math.round(floor.operators * (0.03 + Math.sin(seed + idx) * 0.025));
        const absentPct = parseFloat(((absent / floor.operators) * 100).toFixed(1));

        const setChange = Math.round(1 + (seed % 3));
        const remarksArr = [
          "Normal operation, target achieved.",
          "Minor Lycra breakages sorted out.",
          "Good quality yarn allocation, standard run.",
          "High machine efficiency observed.",
          "Awaiting set setup in morning shift.",
          "Yarn feeding delay in shift C resolved."
        ];
        const remarks = isEFLExtCritical
          ? "Motor malfunction in group B circular frames. Resumed after maintenance."
          : remarksArr[Math.floor((seed + idx) % remarksArr.length)];

        const ledgerRow = [
          "rec-" + dateStr + "-" + floor.name.toLowerCase().replace(' ', '-'),
          dateStr,
          floor.name,
          "July",
          2026,
          targetVariation,
          shiftA,
          shiftB,
          shiftC,
          totalProduction,
          runningMachine,
          idleMachine,
          machineUtilization,
          idleMachinePct,
          idleProduction,
          efficiency,
          productionPerMachine,
          reject,
          rejectPct,
          hold,
          holdPct,
          needleBroken,
          needlePerKg,
          sinkerBroken,
          oilConsumption,
          productionLossForEfficiency,
          capacityUtilization,
          floor.operators,
          absent,
          absentPct,
          setChange,
          remarks,
          0, // productionFlatKnit
          0, // yarnIssued
          0, // runningFactories
          0  // fabricReturn
        ];
        ledgerSheet.appendRow(ledgerRow);
      });
    }

    logActivityInternal("SYSTEM", "Created 'Production_Ledger' database table & seeded historical ledger records.");
  }
}

/**
 * Returns a relative ISO date string (YYYY-MM-DD) based on offset
 */
function getRelativeDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + "-" + mm + "-" + dd;
}

// ==========================================================
// AUTHENTICATION ENDPOINT
// ==========================================================

/**
 * Validates credentials against the Users sheet and generates a secure session.
 */
function handleLogin(payload) {
  const uid = (payload.uid || "").toString().trim().toUpperCase();
  const password = (payload.password || "").toString().trim();

  if (!uid || !password) {
    return makeResponse({
      success: false,
      message: "Please enter both User ID (UID) and Password."
    });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  
  // Extract headers
  const headers = data[0];
  const uidCol = headers.indexOf("uid");
  const pwdCol = headers.indexOf("password");
  const statusCol = headers.indexOf("status");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[uidCol].toString().toUpperCase() === uid) {
      if (row[pwdCol].toString() === password) {
        if (row[statusCol].toString().toLowerCase() !== "active") {
          return makeResponse({
            success: false,
            message: "This account is inactive. Please contact your system administrator."
          });
        }

        // Generate user data response mapping headers to row index
        const userObj = {};
        for (let c = 0; c < headers.length; c++) {
          if (headers[c] !== "password") {
            userObj[headers[c]] = row[c];
          }
        }

        // Generate a simple token
        const token = Utilities.base64Encode(
          Utilities.computeHmacSignature(
            Utilities.MacAlgorithm.HMAC_SHA_256, 
            uid + "_" + new Date().getTime(), 
            SECRET_TOKEN_SALT
          )
        );
        userObj.token = token;

        // Log this login event
        logActivityInternal(uid, "Successfully logged into Knitting ERP Portal");

        return makeResponse({
          success: true,
          message: "Authorization successful.",
          data: userObj
        });
      } else {
        return makeResponse({
          success: false,
          message: "Incorrect password. Please try again."
        });
      }
    }
  }

  return makeResponse({
    success: false,
    message: "User ID (UID) not found in directory."
  });
}

// ==========================================================
// PRODUCTION DATA OPERATIONS
// ==========================================================

/**
 * Inserts a new production entry to the sheet after validation.
 */
function handleAddProduction(payload) {
  // Enforce validation and permission check
  const auth = validatePermissions(payload, "Read / Write");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const entry = payload.data || {};
  
  // Mandatory fields
  if (!entry.floorId || !entry.productionKg) {
    return makeResponse({
      success: false,
      message: "Required fields (Unit, Production weight) are missing."
    });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Data");
  const data = sheet.getDataRange().getValues();
  
  // Prevent duplicate production entries for the exact same Unit, Machine, Date, and Shift
  const floorId = entry.floorId.toString().toLowerCase();
  const date = (entry.date || getRelativeDateString(0)).toString();
  const shift = (entry.shift || "A").toString();
  const machineId = (entry.machineId || "").toString();

  const headers = data[0];
  const floorCol = headers.indexOf("floorId");
  const dateCol = headers.indexOf("date");
  const shiftCol = headers.indexOf("shift");
  const machineCol = headers.indexOf("machineId");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (
      row[floorCol].toString().toLowerCase() === floorId &&
      row[dateCol].toString() === date &&
      row[shiftCol].toString() === shift &&
      row[machineCol].toString() === machineId
    ) {
      return makeResponse({
        success: false,
        message: "Duplicate entry blocked! Production record already exists for " + 
                 entry.floorId.toUpperCase() + ", Machine " + machineId + ", Shift " + shift + " on " + date
      });
    }
  }

  // Generate unique ID
  const newId = "ent-" + (data.length + 1) + "-" + Math.floor(Math.random() * 1000);
  
  // Assemble row based on sheet columns
  // "id", "floorId", "timestamp", "machineId", "operatorName", "shift", 
  // "yarnType", "fabricType", "productionKg", "rejectKg", "remarks", 
  // "holdKg", "activeMachines", "totalMachines", "needlesConsumed", "oilConsumed", "date"
  const newRow = [
    newId,
    entry.floorId,
    entry.timestamp || new Date().toTimeString().slice(0, 5),
    entry.machineId || "M-X",
    entry.operatorName || "N/A",
    entry.shift || "A",
    entry.yarnType || "N/A",
    entry.fabricType || "N/A",
    parseFloat(entry.productionKg) || 0,
    parseFloat(entry.rejectKg) || 0,
    entry.remarks || "",
    parseFloat(entry.holdKg) || 0,
    parseInt(entry.activeMachines) || 0,
    parseInt(entry.totalMachines) || 0,
    parseInt(entry.needlesConsumed) || 0,
    parseInt(entry.oilConsumed) || 0,
    date
  ];

  sheet.appendRow(newRow);
  logActivityInternal(payload.uid, "Added production record: " + newId + " on " + entry.floorId.toUpperCase());

  return makeResponse({
    success: true,
    message: "Production data saved successfully to Google Sheets.",
    data: { id: newId }
  });
}

/**
 * Updates an existing production entry.
 */
function handleUpdateProduction(payload) {
  const auth = validatePermissions(payload, "Read / Write");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const entry = payload.data || {};
  if (!entry.id) {
    return makeResponse({ success: false, message: "Production Entry ID is missing." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Data");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("id");

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === entry.id.toString()) {
      rowIndex = i + 1; // 1-indexed and account for headers
      break;
    }
  }

  if (rowIndex === -1) {
    return makeResponse({ success: false, message: "Production entry not found." });
  }

  // Update specific cells
  // "id", "floorId", "timestamp", "machineId", "operatorName", "shift", 
  // "yarnType", "fabricType", "productionKg", "rejectKg", "remarks", 
  // "holdKg", "activeMachines", "totalMachines", "needlesConsumed", "oilConsumed", "date"
  const colMappings = {
    floorId: headers.indexOf("floorId") + 1,
    timestamp: headers.indexOf("timestamp") + 1,
    machineId: headers.indexOf("machineId") + 1,
    operatorName: headers.indexOf("operatorName") + 1,
    shift: headers.indexOf("shift") + 1,
    yarnType: headers.indexOf("yarnType") + 1,
    fabricType: headers.indexOf("fabricType") + 1,
    productionKg: headers.indexOf("productionKg") + 1,
    rejectKg: headers.indexOf("rejectKg") + 1,
    remarks: headers.indexOf("remarks") + 1,
    holdKg: headers.indexOf("holdKg") + 1,
    activeMachines: headers.indexOf("activeMachines") + 1,
    totalMachines: headers.indexOf("totalMachines") + 1,
    needlesConsumed: headers.indexOf("needlesConsumed") + 1,
    oilConsumed: headers.indexOf("oilConsumed") + 1,
    date: headers.indexOf("date") + 1
  };

  for (const field in colMappings) {
    if (entry[field] !== undefined && colMappings[field] > 0) {
      let val = entry[field];
      if (field === "productionKg" || field === "rejectKg" || field === "holdKg") {
        val = parseFloat(val) || 0;
      } else if (field === "activeMachines" || field === "totalMachines" || field === "needlesConsumed" || field === "oilConsumed") {
        val = parseInt(val) || 0;
      }
      sheet.getRange(rowIndex, colMappings[field]).setValue(val);
    }
  }

  logActivityInternal(payload.uid, "Updated production record: " + entry.id);

  return makeResponse({
    success: true,
    message: "Production record updated successfully.",
    data: entry
  });
}

/**
 * Deletes a production entry.
 */
function handleDeleteProduction(payload) {
  const auth = validatePermissions(payload, "Read / Write");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const id = payload.id;
  if (!id) {
    return makeResponse({ success: false, message: "Production record ID is missing for deletion." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Data");
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf("id");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      logActivityInternal(payload.uid, "Deleted production record: " + id);
      return makeResponse({
        success: true,
        message: "Production record successfully removed from Google Sheets database."
      });
    }
  }

  return makeResponse({
    success: false,
    message: "Production record not found in database."
  });
}

/**
 * Returns a filtered list of all production entries.
 * Parameters can include unit, startDate, endDate, month, year.
 */
function handleGetProductionList(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Data");
  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  
  const entries = [];
  
  // Filters from query params
  const filterUnit = e.parameter.unit; // e.g. "ekl"
  const filterDate = e.parameter.date; // Single date YYYY-MM-DD
  const filterStartDate = e.parameter.startDate; // YYYY-MM-DD
  const filterEndDate = e.parameter.endDate; // YYYY-MM-DD
  const filterMonth = e.parameter.month; // e.g. "7"
  const filterYear = e.parameter.year; // e.g. "2026"

  const idCol = headers.indexOf("id");
  const floorCol = headers.indexOf("floorId");
  const tsCol = headers.indexOf("timestamp");
  const machCol = headers.indexOf("machineId");
  const opCol = headers.indexOf("operatorName");
  const shiftCol = headers.indexOf("shift");
  const yarnCol = headers.indexOf("yarnType");
  const fabCol = headers.indexOf("fabricType");
  const prodCol = headers.indexOf("productionKg");
  const rejCol = headers.indexOf("rejectKg");
  const remCol = headers.indexOf("remarks");
  const holdCol = headers.indexOf("holdKg");
  const dateCol = headers.indexOf("date");

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const rowUnit = row[floorCol].toString().toLowerCase();
    const rowDateStr = row[dateCol].toString(); // YYYY-MM-DD
    
    // Parse row date parts
    const dateObj = new Date(rowDateStr);
    const rowYear = isNaN(dateObj.getTime()) ? "" : dateObj.getFullYear().toString();
    const rowMonth = isNaN(dateObj.getTime()) ? "" : (dateObj.getMonth() + 1).toString();

    // Apply unit filter
    if (filterUnit && filterUnit.toLowerCase() !== "all" && rowUnit !== filterUnit.toLowerCase()) {
      continue;
    }

    // Apply single date filter
    if (filterDate && rowDateStr !== filterDate) {
      continue;
    }

    // Apply date range filters
    if (filterStartDate && rowDateStr < filterStartDate) {
      continue;
    }
    if (filterEndDate && rowDateStr > filterEndDate) {
      continue;
    }

    // Apply month and year filters
    if (filterMonth && rowMonth !== filterMonth) {
      continue;
    }
    if (filterYear && rowYear !== filterYear) {
      continue;
    }

    // Construct record object
    let tsVal = "";
    if (row[tsCol] instanceof Date) {
      tsVal = String(row[tsCol].getHours()).padStart(2, '0') + ":" + String(row[tsCol].getMinutes()).padStart(2, '0');
    } else if (row[tsCol] !== undefined && row[tsCol] !== null) {
      tsVal = row[tsCol].toString();
    }

    entries.push({
      id: row[idCol],
      floorId: row[floorCol],
      timestamp: tsVal,
      machineId: row[machCol],
      operatorName: row[opCol],
      shift: row[shiftCol],
      yarnType: row[yarnCol],
      fabricType: row[fabCol],
      productionKg: parseFloat(row[prodCol]) || 0,
      rejectKg: parseFloat(row[rejCol]) || 0,
      remarks: row[remCol] || "",
      holdKg: parseFloat(row[holdCol]) || 0,
      date: rowDateStr
    });
  }

  // Sort by date/timestamp descending with type protection
  entries.sort((a, b) => {
    const dateA = a.date ? a.date.toString() : "";
    const dateB = b.date ? b.date.toString() : "";
    const dComp = dateB.localeCompare(dateA);
    if (dComp !== 0) return dComp;

    const tsA = a.timestamp ? a.timestamp.toString() : "";
    const tsB = b.timestamp ? b.timestamp.toString() : "";
    return tsB.localeCompare(tsA);
  });

  return makeResponse({
    success: true,
    data: entries
  });
}

/**
 * Returns specific details of a single production entry.
 */
function handleGetProductionDetails(e) {
  const id = e.parameter.id;
  if (!id) {
    return makeResponse({ success: false, message: "ID is required." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Data");
  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  const idCol = headers.indexOf("id");

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (row[idCol].toString() === id.toString()) {
      const detailObj = {};
      for (let c = 0; c < headers.length; c++) {
        detailObj[headers[c]] = row[c];
      }
      return makeResponse({
        success: true,
        data: detailObj
      });
    }
  }

  return makeResponse({
    success: false,
    message: "Production record not found."
  });
}

// ==========================================================
// PRODUCTION LEDGER OPERATIONS
// ==========================================================

/**
 * Returns all production ledger rows from Google Sheets.
 */
function handleGetLedgerList(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Production_Ledger");
  if (!sheet) {
    // Attempt auto-rebootstrap if somehow missing
    initializeDatabase();
    sheet = ss.getSheetByName("Production_Ledger");
    if (!sheet) {
      return makeResponse({ success: false, message: "Production_Ledger sheet not found in spreadsheet." });
    }
  }
  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  
  const records = [];
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const recordObj = {};
    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      let val = row[c];
      // Type conversions to match typescript LedgerRecord types
      if (colName === "year" || colName === "target" || colName === "shiftA" || colName === "shiftB" || colName === "shiftC" || 
          colName === "totalProduction" || colName === "runningMachine" || colName === "idleMachine" || 
          colName === "machineUtilization" || colName === "idleMachinePct" || colName === "idleProduction" || 
          colName === "efficiency" || colName === "productionPerMachine" || colName === "reject" || 
          colName === "rejectPct" || colName === "hold" || colName === "holdPct" || colName === "needleBroken" || 
          colName === "needlePerKg" || colName === "sinkerBroken" || colName === "oilConsumption" || 
          colName === "productionLossForEfficiency" || colName === "capacityUtilization" || colName === "totalOperator" || 
          colName === "absent" || colName === "absentPct" || colName === "setChange" || 
          colName === "productionFlatKnit" || colName === "yarnIssued" || colName === "runningFactories" || colName === "fabricReturn") {
        val = parseFloat(val) || 0;
      } else if (colName === "date" && val instanceof Date) {
        const yyyy = val.getFullYear();
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const dd = String(val.getDate()).padStart(2, '0');
        val = yyyy + "-" + mm + "-" + dd;
      } else if (colName === "date" && val) {
        val = val.toString();
      }
      recordObj[colName] = val;
    }
    records.push(recordObj);
  }

  // Sort by date descending with type protection
  records.sort(function(a, b) {
    const dateA = a.date ? a.date.toString() : "";
    const dateB = b.date ? b.date.toString() : "";
    return dateB.localeCompare(dateA);
  });

  return makeResponse({
    success: true,
    data: records
  });
}

/**
 * Inserts a new production ledger entry to the sheet.
 */
function handleAddLedgerEntry(payload) {
  const auth = validatePermissions(payload, "Read / Write");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const record = payload.data || {};
  if (!record.floor || !record.date) {
    return makeResponse({ success: false, message: "Required fields (floor, date) are missing." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Ledger");
  if (!sheet) {
    return makeResponse({ success: false, message: "Production_Ledger sheet not found." });
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Prevent duplicate ledger entries for the same floor and date
  const floorCol = headers.indexOf("floor");
  const dateCol = headers.indexOf("date");
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[floorCol].toString().toLowerCase() === record.floor.toLowerCase() && row[dateCol].toString() === record.date) {
      return makeResponse({
        success: false,
        message: "Duplicate entry! A ledger record already exists for " + record.floor + " on " + record.date
      });
    }
  }

  // Generate unique ID
  const newId = record.id || ("rec-" + record.date + "-" + record.floor.toLowerCase().replace(' ', '-'));
  
  // Create row
  const newRow = [];
  for (let c = 0; c < headers.length; c++) {
    const colName = headers[c];
    if (colName === "id") {
      newRow.push(newId);
    } else {
      let val = record[colName];
      if (val === undefined) {
        val = (colName === "remarks") ? "" : 0;
      }
      newRow.push(val);
    }
  }

  sheet.appendRow(newRow);
  logActivityInternal(payload.uid, "Added Production Ledger record for " + record.floor + " on " + record.date);

  return makeResponse({
    success: true,
    message: "Production Ledger record saved successfully.",
    data: { id: newId }
  });
}

/**
 * Updates an existing production ledger entry in the sheet.
 */
function handleUpdateLedgerEntry(payload) {
  const auth = validatePermissions(payload, "Read / Write");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const record = payload.data || {};
  if (!record.id) {
    return makeResponse({ success: false, message: "Ledger Record ID is missing." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Ledger");
  if (!sheet) {
    return makeResponse({ success: false, message: "Production_Ledger sheet not found." });
  }
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("id");

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === record.id.toString()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return makeResponse({ success: false, message: "Ledger record not found." });
  }

  // Update cells
  for (let c = 0; c < headers.length; c++) {
    const colName = headers[c];
    if (colName !== "id" && record[colName] !== undefined) {
      sheet.getRange(rowIndex, c + 1).setValue(record[colName]);
    }
  }

  logActivityInternal(payload.uid, "Updated Production Ledger record for " + record.floor + " on " + record.date);

  return makeResponse({
    success: true,
    message: "Production Ledger record updated successfully."
  });
}

/**
 * Deletes a ledger entry.
 */
function handleDeleteLedgerEntry(payload) {
  const auth = validatePermissions(payload, "Admin");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const id = payload.id;
  if (!id) {
    return makeResponse({ success: false, message: "Ledger Record ID is missing." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Production_Ledger");
  if (!sheet) {
    return makeResponse({ success: false, message: "Production_Ledger sheet not found." });
  }
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf("id");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      logActivityInternal(payload.uid, "Deleted Production Ledger record: " + id);
      return makeResponse({
        success: true,
        message: "Production Ledger record successfully removed."
      });
    }
  }

  return makeResponse({
    success: false,
    message: "Production Ledger record not found."
  });
}

// ==========================================================
// DYNAMIC DASHBOARD ENGINE & KPI CALCULATIONS
// ==========================================================

/**
 * Aggregates factory-wide KPIs dynamically based on filters.
 * Computes Total Production, Achievement %, Reject %, Hold %, Capacity, and Machine Utilization.
 */
function handleGetDashboardFactory(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read production records
  const prodSheet = ss.getSheetByName("Production_Data");
  const prodData = prodSheet.getDataRange().getValues();
  const prodHeaders = prodData[0];

  // Read current configuration targets/machines from Settings
  const settingsSheet = ss.getSheetByName("Settings");
  const settingsData = settingsSheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < settingsData.length; i++) {
    settings[settingsData[i][0]] = settingsData[i][1];
  }

  // Parse filters
  const filterUnit = e.parameter.unit;
  const filterDate = e.parameter.date || getRelativeDateString(0);
  const filterStartDate = e.parameter.startDate;
  const filterEndDate = e.parameter.endDate;

  // Track aggregates
  let totalProduction = 0;
  let totalReject = 0;
  let totalHold = 0;
  let totalNeedles = 0;
  let totalOil = 0;
  
  // Floor configuration mapping
  const activeUnitTargets = {};
  const activeUnitMachines = {};
  
  const units = ["ekl", "efl", "efl-2", "auto-stripe", "efl-extension", "esl-extension"];
  const displayNames = {
    "ekl": "EKL",
    "efl": "EFL",
    "efl-2": "EFL-2",
    "auto-stripe": "Auto Stripe",
    "efl-extension": "EFL-Extension",
    "esl-extension": "ESL-Extension"
  };

  // Populate config targets
  units.forEach(u => {
    const displayName = displayNames[u];
    activeUnitTargets[u] = parseFloat(settings["target_capacity_" + displayName]) || 10000;
    activeUnitMachines[u] = parseInt(settings["total_machines_" + displayName]) || 30;
  });

  const rowFloorCol = prodHeaders.indexOf("floorId");
  const rowProdCol = prodHeaders.indexOf("productionKg");
  const rowRejCol = prodHeaders.indexOf("rejectKg");
  const rowHoldCol = prodHeaders.indexOf("holdKg");
  const rowNeedleCol = prodHeaders.indexOf("needlesConsumed");
  const rowOilCol = prodHeaders.indexOf("oilConsumed");
  const rowDateCol = prodHeaders.indexOf("date");

  // Keep track of unit-specific running/machines dynamically seen in entries
  const unitDynamicMetrics = {};
  units.forEach(u => {
    unitDynamicMetrics[u] = { production: 0, reject: 0, hold: 0, entriesCount: 0 };
  });

  for (let i = 1; i < prodData.length; i++) {
    const row = prodData[i];
    const rowUnit = row[rowFloorCol].toString().toLowerCase();
    const rowDate = row[rowDateCol].toString();

    // Apply date range filters or default single-date filter
    if (filterStartDate || filterEndDate) {
      if (filterStartDate && rowDate < filterStartDate) continue;
      if (filterEndDate && rowDate > filterEndDate) continue;
    } else if (filterDate && filterDate !== "all" && rowDate !== filterDate) {
      continue;
    }

    // Apply unit filter
    if (filterUnit && filterUnit !== "all" && rowUnit !== filterUnit.toLowerCase()) {
      continue;
    }

    const prodWeight = parseFloat(row[rowProdCol]) || 0;
    const rejWeight = parseFloat(row[rowRejCol]) || 0;
    const holdWeight = parseFloat(row[rowHoldCol]) || 0;
    const needles = parseInt(row[rowNeedleCol]) || 0;
    const oil = parseInt(row[rowOilCol]) || 0;

    totalProduction += prodWeight;
    totalReject += rejWeight;
    totalHold += holdWeight;
    totalNeedles += needles;
    totalOil += oil;

    if (unitDynamicMetrics[rowUnit] !== undefined) {
      unitDynamicMetrics[rowUnit].production += prodWeight;
      unitDynamicMetrics[rowUnit].reject += rejWeight;
      unitDynamicMetrics[rowUnit].hold += holdWeight;
      unitDynamicMetrics[rowUnit].entriesCount += 1;
    }
  }

  // Calculate overall target based on filtered units
  let totalPlanTarget = 0;
  let totalTotalMachines = 0;
  let runningMachinesEst = 0;

  if (filterUnit && filterUnit !== "all") {
    const u = filterUnit.toLowerCase();
    totalPlanTarget = activeUnitTargets[u] || 0;
    totalTotalMachines = activeUnitMachines[u] || 0;
    runningMachinesEst = Math.round(totalTotalMachines * 0.88); // Estimate running percentage
  } else {
    units.forEach(u => {
      totalPlanTarget += activeUnitTargets[u] || 0;
      totalTotalMachines += activeUnitMachines[u] || 0;
      runningMachinesEst += Math.round((activeUnitMachines[u] || 0) * 0.88);
    });
  }

  // Compute percentage calculations
  const achievementPct = totalPlanTarget > 0 ? Math.round((totalProduction / totalPlanTarget) * 1000) / 10 : 0;
  const rejectPct = totalProduction > 0 ? Math.round((totalReject / totalProduction) * 10000) / 100 : 0;
  const holdPct = totalProduction > 0 ? Math.round((totalHold / totalProduction) * 1000) / 10 : 0;
  const idleMachinesEst = totalTotalMachines - runningMachinesEst;
  
  // Capacity and general efficiency logic (JS dynamic)
  const factoryEfficiency = Math.min(98.5, Math.max(65.0, 100 - (rejectPct * 2) - (idleMachinesEst / totalTotalMachines * 10)));

  // Package response format matching frontend expectations
  const dashboardData = {
    summary: {
      totalProduction: totalProduction,
      totalTarget: totalPlanTarget,
      achievementPct: achievementPct,
      runningMachines: runningMachinesEst,
      totalMachines: totalTotalMachines,
      idleMachines: idleMachinesEst,
      rejectPct: rejectPct,
      holdKg: totalHold,
      needlesConsumed: totalNeedles,
      oilConsumed: totalOil,
      efficiencyPct: Math.round(factoryEfficiency * 10) / 10
    },
    floors: units.map(u => {
      const displayName = displayNames[u];
      const target = activeUnitTargets[u] || 10000;
      const actual = unitDynamicMetrics[u].production;
      const floorAch = target > 0 ? Math.round((actual / target) * 1000) / 10 : 0;
      const floorRej = actual > 0 ? Math.round((unitDynamicMetrics[u].reject / actual) * 1000) / 10 : 0;
      const totalMach = activeUnitMachines[u] || 30;
      const activeMach = Math.round(totalMach * (floorAch > 90 ? 0.92 : floorAch > 75 ? 0.85 : 0.70));
      
      let status = "optimal";
      if (floorAch < 75) status = "critical";
      else if (floorAch < 90) status = "warning";

      return {
        id: u,
        name: displayName,
        longName: displayName + " Knitting Division",
        status: status,
        targetKg: target,
        productionKg: actual,
        achievementPct: floorAch,
        runningMachines: activeMach,
        totalMachines: totalMach,
        idleMachines: totalMach - activeMach,
        efficiencyPct: Math.round((95 - (floorRej * 1.5)) * 10) / 10,
        rejectPct: floorRej,
        lastUpdated: "Just now"
      };
    })
  };

  return makeResponse({
    success: true,
    data: dashboardData
  });
}

/**
 * Returns deep KPI metrics and shift aggregates for a specific floor unit.
 */
function handleGetDashboardFloor(e) {
  const floorId = e.parameter.floorId;
  if (!floorId) {
    return makeResponse({ success: false, message: "Floor ID is required for deep analysis." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName("Production_Data");
  const prodData = prodSheet.getDataRange().getValues();
  const headers = prodData[0];

  const floorCol = headers.indexOf("floorId");
  const prodCol = headers.indexOf("productionKg");
  const rejCol = headers.indexOf("rejectKg");
  const holdCol = headers.indexOf("holdKg");
  const shiftCol = headers.indexOf("shift");
  const dateCol = headers.indexOf("date");

  const filterDate = e.parameter.date || getRelativeDateString(0);

  // Shift aggregates
  const shifts = {
    "A": { production: 0, reject: 0 },
    "B": { production: 0, reject: 0 },
    "C": { production: 0, reject: 0 }
  };

  for (let i = 1; i < prodData.length; i++) {
    const row = prodData[i];
    const rowUnit = row[floorCol].toString().toLowerCase();
    const rowDate = row[dateCol].toString();
    const rowShift = row[shiftCol].toString().toUpperCase();

    if (rowUnit !== floorId.toLowerCase()) continue;
    if (filterDate && filterDate !== "all" && rowDate !== filterDate) continue;

    const actual = parseFloat(row[prodCol]) || 0;
    const reject = parseFloat(row[rejCol]) || 0;

    if (shifts[rowShift] !== undefined) {
      shifts[rowShift].production += actual;
      shifts[rowShift].reject += reject;
    }
  }

  return makeResponse({
    success: true,
    data: {
      floorId: floorId,
      shifts: shifts,
      calculatedAt: new Date().toISOString()
    }
  });
}

// ==========================================================
// USER DIRECTORY OPERATIONS
// ==========================================================

/**
 * Lists all registered users in the database (excluding plain text passwords).
 */
function handleGetUsers(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const users = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const userObj = {};
    for (let c = 0; c < headers.length; c++) {
      if (headers[c] === "password") {
        userObj[headers[c]] = "••••••••"; // Scramble passwords
      } else {
        userObj[headers[c]] = row[c];
      }
    }
    // Set mock id based on row index
    userObj.id = "user-" + i;
    users.push(userObj);
  }

  return makeResponse({
    success: true,
    data: users
  });
}

/**
 * Registers a new user.
 */
function handleAddUser(payload) {
  const auth = validatePermissions(payload, "Admin");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const user = payload.data || {};
  if (!user.uid || !user.userName || !user.password) {
    return makeResponse({ success: false, message: "Missing required profile parameters (UID, Full Name, Password)." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const uidCol = data[0].indexOf("uid");

  // Validate uniqueness of UID
  const cleanUid = user.uid.trim().toUpperCase();
  for (let i = 1; i < data.length; i++) {
    if (data[i][uidCol].toString().toUpperCase() === cleanUid) {
      return makeResponse({
        success: false,
        message: "Unique identity breach! Employee UID " + cleanUid + " is already registered in the directory."
      });
    }
  }

  // Format arrays to CSV strings
  const assignedStr = Array.isArray(user.assignedUnits) ? user.assignedUnits.join(", ") : (user.assignedUnit || "EKL");
  const allowedTabsStr = Array.isArray(user.allowedTabs) ? user.allowedTabs.join(", ") : "Dashboard, Production Ledger, Settings";

  const newRow = [
    user.userName,
    user.userType || "General",
    user.designation || "Operator",
    cleanUid,
    user.password,
    user.department || "Knitting",
    assignedStr,
    user.permission || "Read",
    user.status || "Active",
    new Date().toISOString(),
    new Date().toISOString(),
    allowedTabsStr
  ];

  sheet.appendRow(newRow);
  logActivityInternal(payload.uid, "Created user account: " + cleanUid + " (" + user.userName + ")");

  return makeResponse({
    success: true,
    message: "User registered successfully into Central Directory.",
    data: { uid: cleanUid }
  });
}

/**
 * Updates user settings or credentials.
 */
function handleUpdateUser(payload) {
  const auth = validatePermissions(payload, "Admin");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const user = payload.data || {};
  if (!user.uid) {
    return makeResponse({ success: false, message: "Employee UID is required to update profile." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const uidCol = headers.indexOf("uid");

  let rowIndex = -1;
  const cleanUid = user.uid.trim().toUpperCase();
  for (let i = 1; i < data.length; i++) {
    if (data[i][uidCol].toString().toUpperCase() === cleanUid) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return makeResponse({ success: false, message: "User not found in directory." });
  }

  // Mappings to column indices
  const colMappings = {
    userName: headers.indexOf("userName") + 1,
    userType: headers.indexOf("userType") + 1,
    designation: headers.indexOf("designation") + 1,
    department: headers.indexOf("department") + 1,
    assignedUnit: headers.indexOf("assignedUnit") + 1,
    permission: headers.indexOf("permission") + 1,
    status: headers.indexOf("status") + 1,
    allowedTabs: headers.indexOf("allowedTabs") + 1
  };

  // Update password if a valid new password is provided
  if (user.password && user.password !== "••••••••" && user.password.trim() !== "") {
    const pwdCol = headers.indexOf("password") + 1;
    sheet.getRange(rowIndex, pwdCol).setValue(user.password.trim());
  }

  // Update fields
  for (const field in colMappings) {
    if (user[field] !== undefined && colMappings[field] > 0) {
      let val = user[field];
      if (field === "assignedUnit" && Array.isArray(val)) {
        val = val.join(", ");
      } else if (field === "allowedTabs" && Array.isArray(val)) {
        val = val.join(", ");
      }
      sheet.getRange(rowIndex, colMappings[field]).setValue(val);
    }
  }

  // Update modified date
  const updatedDateCol = headers.indexOf("updatedDate") + 1;
  sheet.getRange(rowIndex, updatedDateCol).setValue(new Date().toISOString());

  logActivityInternal(payload.uid, "Updated profile/credentials of user: " + cleanUid);

  return makeResponse({
    success: true,
    message: "User profile updated successfully."
  });
}

/**
 * Removes a user from the directory.
 */
function handleDeleteUser(payload) {
  const auth = validatePermissions(payload, "Admin");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const targetUid = payload.targetUid;
  if (!targetUid) {
    return makeResponse({ success: false, message: "Target employee UID is missing." });
  }

  if (targetUid.toString().toUpperCase() === payload.uid.toString().toUpperCase()) {
    return makeResponse({ success: false, message: "Action blocked! You cannot delete your own active administrator account." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const uidCol = data[0].indexOf("uid");

  for (let i = 1; i < data.length; i++) {
    if (data[i][uidCol].toString().toUpperCase() === targetUid.toString().toUpperCase()) {
      sheet.deleteRow(i + 1);
      logActivityInternal(payload.uid, "Deleted user from directory: " + targetUid);
      return makeResponse({
        success: true,
        message: "User successfully deleted from database."
      });
    }
  }

  return makeResponse({
    success: false,
    message: "User not found."
  });
}

// ==========================================================
// SYSTEM SETTINGS OPERATIONS
// ==========================================================

/**
 * Returns all system configuration constants.
 */
function handleGetSettings(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Settings");
  const data = sheet.getDataRange().getValues();
  
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }

  return makeResponse({
    success: true,
    data: settings
  });
}

/**
 * Commits a full set of settings key-values to spreadsheet storage.
 */
function handleUpdateSettings(payload) {
  const auth = validatePermissions(payload, "Read / Write");
  if (!auth.authorized) {
    return makeResponse({ success: false, message: auth.message });
  }

  const settingsObj = payload.data || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Settings");
  
  // To avoid duplicate keys, we retrieve current list first and build mapping
  const data = sheet.getDataRange().getValues();
  const keysCol = 0;
  const valsCol = 1;

  const keyRowMapping = {};
  for (let i = 1; i < data.length; i++) {
    keyRowMapping[data[i][keysCol]] = i + 1; // Row index
  }

  // Iterate setting keys and append or overwrite
  for (const key in settingsObj) {
    const stringVal = settingsObj[key].toString();
    if (keyRowMapping[key]) {
      // Overwrite existing key
      sheet.getRange(keyRowMapping[key], valsCol + 1).setValue(stringVal);
    } else {
      // Append new key
      sheet.appendRow([key, stringVal]);
    }
  }

  logActivityInternal(payload.uid, "Updated system performance configurations.");

  return makeResponse({
    success: true,
    message: "Configuration successfully committed to Google Sheets."
  });
}

// ==========================================================
// CENTRALIZED ACTIVITY LOG LOGIC
// ==========================================================

/**
 * Logs a custom event into the spreadsheet log.
 */
function logActivityInternal(uid, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Activity_Log");
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const logId = "log-" + (data.length + 1) + "-" + Math.floor(Math.random() * 1000);
    const timestamp = new Date().toISOString();

    let eventType = "system";
    if (message.includes("login") || message.includes("logged")) eventType = "system";
    else if (message.includes("Added") || message.includes("production")) eventType = "production";
    else if (message.includes("Deleted") || message.includes("Updated")) eventType = "maintenance";

    let status = "info";
    if (message.includes("error") || message.includes("breach") || message.includes("blocked")) status = "danger";
    else if (message.includes("success") || message.includes("Added")) status = "success";

    // Header structure: ["id", "timestamp", "floorId", "type", "message", "status", "uid"]
    sheet.appendRow([
      logId,
      timestamp,
      "all",
      eventType,
      message,
      status,
      uid || "ANONYMOUS"
    ]);
  } catch (err) {
    // Fail silently in logger to prevent blocking the main request
    console.error("Failed to write to activity log: " + err.toString());
  }
}

/**
 * Returns latest system activities from the log sheet.
 */
function handleGetActivityLog(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Activity_Log");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const logs = [];
  const limit = parseInt(e.parameter.limit) || 50;

  const idCol = headers.indexOf("id");
  const tsCol = headers.indexOf("timestamp");
  const floorCol = headers.indexOf("floorId");
  const typeCol = headers.indexOf("type");
  const msgCol = headers.indexOf("message");
  const statusCol = headers.indexOf("status");
  const uidCol = headers.indexOf("uid");

  // Read starting from bottom (most recent logs first)
  const startRow = Math.max(1, data.length - limit);
  for (let i = data.length - 1; i >= startRow; i--) {
    const row = data[i];
    
    // Parse timestamp to a simpler display, e.g. "21:24" or full ISO
    let formattedTime = "";
    try {
      const dateObj = new Date(row[tsCol]);
      if (!isNaN(dateObj.getTime())) {
        formattedTime = String(dateObj.getHours()).padStart(2, '0') + ":" + String(dateObj.getMinutes()).padStart(2, '0');
      } else {
        formattedTime = row[tsCol].toString();
      }
    } catch(ex) {
      formattedTime = "N/A";
    }

    logs.push({
      id: row[idCol],
      timestamp: formattedTime,
      fullTimestamp: row[tsCol],
      floorId: row[floorCol],
      type: row[typeCol],
      message: row[msgCol],
      status: row[statusCol],
      uid: row[uidCol]
    });
  }

  return makeResponse({
    success: true,
    data: logs
  });
}

// ==========================================================
// SECURITY & PERMISSION VALIDATOR
// ==========================================================

/**
 * Performs verification on the user request.
 * Checks status, userType, and required permission level.
 */
function validatePermissions(payload, requiredLevel) {
  const uid = (payload.uid || "").toString().trim().toUpperCase();
  const token = payload.token || "";

  if (!uid) {
    return { authorized: false, message: "Unauthenticated action! User identity UID is missing." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const uidCol = headers.indexOf("uid");
  const typeCol = headers.indexOf("userType");
  const permissionCol = headers.indexOf("permission");
  const statusCol = headers.indexOf("status");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[uidCol].toString().toUpperCase() === uid) {
      // Validate Status
      if (row[statusCol].toString().toLowerCase() !== "active") {
        return { authorized: false, message: "Action blocked! This account is inactive." };
      }

      const userType = row[typeCol].toString();
      const userPerm = row[permissionCol].toString();

      // Enforce Admin only actions
      if (requiredLevel === "Admin") {
        if (userType !== "Admin") {
          return { authorized: false, message: "Action blocked! Requires administrative permission level." };
        }
      }

      // Enforce Read / Write level actions
      if (requiredLevel === "Read / Write") {
        if (userPerm !== "Read / Write" && userType !== "Admin") {
          return { authorized: false, message: "Unauthorized action! Your account has Read-Only permissions." };
        }
      }

      return { authorized: true, userType: userType, permission: userPerm };
    }
  }

  return { authorized: false, message: "Action blocked! Credentials verification failed." };
}
