import React from "react";
import {
  Alert,
  Platform,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  Image,
  NativeModules,
  ScrollView,
  Text,
  Button,
  Keyboard,
  CheckBox,
} from "react-native";
import Toast from "react-native-root-toast";
import * as Constants from "./Constants";
//import { STRINGS } from "./Strings";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// local filename -> original URI mapping (persisted) helper keys
const LOCALMAP_PREFIX = 'LOCALFILE:';

export const saveLocalFileMapping = async (filename, uri) => {
  try {
    await AsyncStorage.setItem(LOCALMAP_PREFIX + filename, uri);
  } catch (e) {
    console.error('saveLocalFileMapping failed', e);
  }
};

export const getLocalFileMapping = async (filename) => {
  try {
    return await AsyncStorage.getItem(LOCALMAP_PREFIX + filename);
  } catch (e) {
    console.error('getLocalFileMapping failed', e);
    return null;
  }
};

export const removeLocalFileMapping = async (filename) => {
  try {
    await AsyncStorage.removeItem(LOCALMAP_PREFIX + filename);
  } catch (e) {
    console.error('removeLocalFileMapping failed', e);
  }
};
import * as SQLite from "expo-sqlite";
import * as ServerOperations from "./ServerOperations";
const _attachmentsBase = Constants.serverAttachmentsBaseUrl ? Constants.serverAttachmentsBaseUrl.replace(/\/$/, '') : '';

// Normalize an incoming attachment value (filename or full url) into a server URL.
const normalizeAttachmentValue = (val) => {
  if (!val) return '';
  if (typeof val !== 'string') return '';
  val = val.trim();
  if (val === '') return '';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  // plain filename -> return absolute server url
  return _attachmentsBase + '/' + val.replace(/^\/+/, '');
};
// export const getPath = (uri: string) => {
//   if (uri.startsWith("content://")) {
//     return RNFetchBlob.fs.stat(uri).then((info) => info?.path);
//   }
//   return uri;
// };

export const handleSearch = (text, list) => {
  if (text) {
    const newData = list.filter((item) => {
      const itemData = JSON.stringify(item).toLowerCase();
      const textData = text.toLowerCase();
      const itemDataId = item.ID;
      return itemData.indexOf(textData) > -1
    });
    return newData;
  } else {
    return list;
  }
};


export const saveToAS = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log(error);
  }
};

export const getFromAS = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.log(error);
  }
};

export const multiSaveToAS = async (pairs) => {
  try {
    await AsyncStorage.multiSet(pairs);
  } catch (error) {
    console.log(error);
  }
};

export const removeFromAS = async (key) => {
  try {
    return await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log(error);
  }
};

export const deleteFromVisitSummary = async (id) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  await db.execAsync(`delete from VISIT_SUMMARY WHERE ID='${id}'`);
  await db.execAsync(`delete from VISIT_CATEGORIES WHERE VISIT_ID='${id}'`);
  await db.execAsync(`delete from VISIT_TASKS WHERE VISIT_ID='${id}'`);
  await db.execAsync(`delete from VISIT_ITEMS WHERE VISIT_ID='${id}'`);
}

export const createDB = async () => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  // db.execAsync("drop table if exists CUSTOMERS");
  // db.execAsync("drop table if exists CATEGORIES");
  // db.execAsync("drop table if exists TASKS");
  // db.execAsync("drop table if exists ITEMS");
  // db.execAsync("drop table if exists VISIT_SUMMARY");
  // db.execAsync("drop table if exists VISIT_CATEGORIES");
  // db.execAsync("drop table if exists VISIT_TASKS");
  // db.execAsync("drop table if exists VISIT_ITEMS");
  // db.execAsync("drop table if exists MERCH_PASSWORDS");
  await db.execAsync(`create table if not exists CUSTOMERS(
        CODE text primary key not null,
        NAME text,
        LOCATION text
      )`);

  await db.execAsync(`create table if not exists VISIT_SUMMARY(
    SEQ integer default 0,
    ID text primary key not null,
    IN_TIME text,
    OUT_TIME text,
    CUSTOMER text,
    USER text,
    NOTES text,
    STATUS text
   )`);

  await db.execAsync(`create table if not exists MERCH_USERS(
    ID text primary key not null,
    NAME text
  )`);
  await db.execAsync(`create table if not exists MERCH_PASSWORDS(
    ID text primary key not null,
    DATE text,
    CUSTOMER text,
    MERCH_USER text,
    PASSWORD text
  )`);

  await db.execAsync(`create table if not exists CATEGORIES(
        ID text primary key not null,
        DESC text
      )`);
  await db.execAsync(`create table if not exists ITEMS(
        ID text not null,
        DESC text,
        CATEGORY text,
        TASK text,
        PRIMARY KEY (ID, CATEGORY, TASK)
      )`);

  await db.execAsync(`create table if not exists TASKS(
        ID text primary key not null,
        CREATION_DATE text,
        FDT text,
        TDT text,
        DESC text,
        TYPE text,
        CUST_CODE text,
        USER_NO text,
        CAT_ID text,
        IS_OPTIONAL text
      )`);

  await db.execAsync(`create table if not exists VISIT_CATEGORIES(
        ID text,
        DESC text,
        VISIT_ID text,
        PRIMARY KEY (ID,VISIT_ID)
      )`);
  await db.execAsync(`create table if not exists VISIT_ITEMS(
        ID text,
        DESC text,
        CATEGORY text,
        TASK text,
        ALL_FACES text default '',
        COMPANY_FACES text default '',
        SELLING_PRICE text default '',
        COMP_PROD_LIST text default '',
        EXPIRY_LIST text default '',
        VISIT_ID text default '',
        ITEM_AVAILABLE text,
        PRICING_ATTACHMENT text default '',
        PRIMARY KEY (ID,CATEGORY,VISIT_ID)
      )`);

  await db.execAsync(`create table if not exists VISIT_TASKS(
        ID text,
        CREATION_DATE text,
        FDT text,
        TDT text,
        DESC text,
        TYPE text,
        CUST_CODE text,
        USER_NO text,
        CAT_ID text,
        IMAGES_BEFORE text,
        IMAGES_AFTER text,
        FLYER_ATTACHMENT text default '',
        OFFSHELF_ATTACHMENT text default '',
        VISIT_ID text,
        IS_OPTIONAL text,
        PRIMARY KEY (ID,CAT_ID,VISIT_ID)
      )`);

  await db.execAsync(`create table if not exists VISIT_TIME_TRACKING(
        VISIT_ID text,
        CATEGORY_ID text,
        TASK_ID text,
        TIME_SPENT integer default 0,
        PRIMARY KEY (VISIT_ID, CATEGORY_ID, TASK_ID)
      )`);
};

export const loadCustomers = async (customers) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = ["delete from CUSTOMERS where LOCATION IS NULL OR TRIM(LOCATION) = '' "];
  // Accept multiple server key variations (CODE/code, NAME/name, CUSTOMER/customer) and
  // sanitize single quotes to avoid SQL injection/paste errors in the generated SQL.
  customers.map((line) => {
    const code = (line.CODE || line.code || line.Code || "").toString().replace(/'/g, "''");
    const name = (line.NAME || line.name || line.Customer || line.CUSTOMER || line.CUSTOMER_NAME || "").toString().replace(/'/g, "''");
    const location = (line.LOCATION || line.location || "").toString().replace(/'/g, "''");

    // If name is empty we still insert a record but leave it blank and log a debug line so
    // we can detect why names are missing (server vs parsing). This avoids blank rows in UI.
    if (!name || name.trim() === "") {
      console.log(`loadCustomers: empty name for code=${code}`);
    }

    qlist.push(
      `insert into CUSTOMERS(CODE,NAME,LOCATION) values('${code}','${name}','${location}') ON CONFLICT(CODE) DO UPDATE SET NAME='${name}', LOCATION='${location}' WHERE CODE='${code}'`
    );
  });
  await db.execAsync(qlist.join(";"));
};
export const loadMerchUsers = async (users) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = ["delete from MERCH_USERS"];
  users.map((line) => {
    qlist.push(
      `insert into MERCH_USERS(ID,NAME) values('${line.ID}','${line.NAME}') ON CONFLICT(ID) DO NOTHING`
    );
  });
  await db.execAsync(qlist.join(";"));
};
export const loadVisitPasswords = async (users) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = ["delete from MERCH_PASSWORDS"];
  users.map((line) => {
    qlist.push(
      `insert into MERCH_PASSWORDS(ID,DATE,CUSTOMER,MERCH_USER,PASSWORD) values('${line.ID}','${line.DATE}','${line.CUSTOMER}','${line.MERCH}','${line.PASS}') ON CONFLICT(ID) DO NOTHING`
    );
  });
  await db.execAsync(qlist.join(";"));
};

export const updateCustomerLocationDB = async (code, location) => {
  console.log(code + " + " + location);
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const query = `UPDATE CUSTOMERS SET LOCATION = '${location}' WHERE CODE = '${code}'`
  await db.execAsync(query);
};
export const getCustomerLocationDB = async (code) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT LOCATION FROM CUSTOMERS WHERE CODE = '${code}'`));
  }, null, null);
};

export const addToVisitSummary = async (id, user, customer, inTime, outTime, notes, status) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const seq = id.split("-")[1];
  const query = `insert into VISIT_SUMMARY(SEQ,ID,USER,CUSTOMER,IN_TIME,OUT_TIME,NOTES,STATUS)
   values('${seq}','${id}','${user}','${customer}','${inTime}','${outTime}','${notes}','${status}') 
   ON CONFLICT(ID) DO UPDATE SET USER='${user}',CUSTOMER='${customer}',IN_TIME='${inTime}',OUT_TIME='${outTime}',NOTES='${notes}',STATUS='${status}'`;
  await db.execAsync(query);
};

export const loadItems = async (items) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = ["delete from ITEMS"];
  items.map((line) => {
    qlist.push(
      `insert into ITEMS(ID,DESC,CATEGORY,TASK) values('${line.ID}','${line.DESC}','${line.CATEGORY}','${line.TASK}') ON CONFLICT(ID,CATEGORY,TASK) DO UPDATE SET DESC='${line.DESC}'`
    );
  });
  await db.execAsync(qlist.join(";"));
};
// Clear server-synced master tables before full refresh
export const clearServerSyncedData = async () => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const qlist = [
    "delete from CATEGORIES",
    "delete from TASKS",
    "delete from ITEMS",
    "delete from CUSTOMERS",
    "delete from MERCH_USERS",
    "delete from MERCH_PASSWORDS",
  ];
  await db.execAsync(qlist.join(";"));
};
export const addItemsToVisit = async (items, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = [""];
  const curVisit = await getFromAS("curVisitID");
  items.map((line) => {
    qlist.push(
      `insert into VISIT_ITEMS(ID,DESC,CATEGORY,VISIT_ID,TASK) values('${line.ID}','${line.DESC}','${line.CATEGORY}','${curVisit}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO NOTHING`
    );
  });
  await db.execAsync(qlist.join(";"));
};

export const getCustomersDB = async () => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync('SELECT * FROM CUSTOMERS'));
  }, null, null);
}

export const getCustomerByCodeDB = async (code) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT CODE, NAME FROM CUSTOMERS WHERE CODE = '${code}'`));
  }, null, null);
}

export const getMerchUsersDB = async () => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync('SELECT * FROM MERCH_USERS'));
  }, null, null);
}
export const getMerchPasswordsDB = async (cust, merch, date) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT PASSWORD FROM MERCH_PASSWORDS WHERE CUSTOMER ='${cust}' AND MERCH_USER ='${merch}' AND DATE ='${date}' `));
  }, null, null);
}

export const getNotesDB = async (visit) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT NOTES FROM VISIT_SUMMARY WHERE ID='${visit}' `));
  }, null, null);
}
export const getVisitTimeDB = async (visit) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT IN_TIME,OUT_TIME FROM VISIT_SUMMARY WHERE ID='${visit}' `));
  }, null, null);
}
export const getMyVisitsDB = async (user) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT SEQ,ID,USER,CUSTOMER,IN_TIME,OUT_TIME,NOTES,STATUS,CUSTOMERS.NAME FROM VISIT_SUMMARY LEFT JOIN CUSTOMERS ON CUSTOMERS.CODE =VISIT_SUMMARY.CUSTOMER  WHERE USER='${user}'`));
  }, null, null);
}

export const hasVisitsToday = async (user) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const todayDate = new Date().toLocaleDateString('en-GB').split('/').join('/'); // Format: DD/MM/YYYY
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) as COUNT FROM VISIT_SUMMARY WHERE USER='${user}' AND IN_TIME LIKE '${todayDate}%'`
  );
  return result && result.COUNT > 0;
}

// export const getCustomerName = async (code) => {
//   const db = await SQLite.openDatabaseAsync("merch.db",{useNewConnection: true});
//   return new Promise((resolve, reject) => {
//     resolve(db.getAllAsync(`SELECT NAME FROM CUSTOMERS WHERE CODE='${code}'`));
//   }, null, null);
// }

export const getVisitSequence = async (user) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const result = await db.getFirstAsync(`SELECT MAX(SEQ) as MAX_SEQ FROM VISIT_SUMMARY WHERE USER='${user}'`);
  return result && result.MAX_SEQ ? result.MAX_SEQ : 0;
}

export const checkAndSyncVisits = async (user) => {
  try {
    // Get server's last visit sequence
    const serverResponse = await ServerOperations.getUserLastVisitSeq(user);

    if (!serverResponse || serverResponse.LAST_SEQ === undefined) {
      console.log('Could not get server sequence');
      return { synced: false, message: 'Server unavailable' };
    }

    const serverLastSeq = parseInt(serverResponse.LAST_SEQ) || 0;

    // Get local last visit sequence
    const localLastSeq = await getVisitSequence(user);

    console.log(`Server last seq: ${serverLastSeq}, Local last seq: ${localLastSeq}`);

    // If server has higher sequence, sync visits
    if (serverLastSeq > localLastSeq || localLastSeq === 0 || serverResponse.FORCE_UPDATE || isNaN(localLastSeq)) {
      console.log('Server has newer visits, syncing...');
      const cats = await ServerOperations.getCategories();
      await loadCategories(cats);
      const customers = await ServerOperations.getCustomers();
      await loadCustomers(customers);
      const visitPasses = await ServerOperations.getVisitPasswords();
      await loadVisitPasswords(visitPasses);
      const merchUsers = await ServerOperations.getMerchUsers();
      await loadMerchUsers(merchUsers);
      const tasks = await ServerOperations.getTasks(user);
      const items = await ServerOperations.getCategoryItems();
      await loadItems(items)
      await loadTasks(tasks);
      //   okAlert(i18n.t("dataUpdated"))
      const visitsResponse = await ServerOperations.getUserVisitsJson(user);

      if (visitsResponse && Array.isArray(visitsResponse) && visitsResponse.length > 0) {
        let successCount = 0;
        let errorCount = 0;

        // Process visits sequentially to avoid database locking
        for (const visit of visitsResponse) {
          try {
            const result = await loadVisitFromJson(visit);
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (visitError) {
            console.error('Error loading visit:', visitError);
            errorCount++;
          }
        }

        return {
          synced: true,
          message: `Synced ${successCount} visits`,
          successCount,
          errorCount
        };
      } else {
        return { synced: false, message: 'No visits to sync' };
      }
    } else {
      console.log('Local database is up to date');
      return { synced: false, message: 'Already up to date' };
    }
  } catch (error) {
    console.error('Error in checkAndSyncVisits:', error);
    return { synced: false, message: 'Sync error', error: error.message };
  }
}


export const getCategoryItemsDB = async (category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const res = await db.getAllAsync(`SELECT * FROM VISIT_ITEMS WHERE CATEGORY = '${category}' AND VISIT_ID = '${curVisit}' AND TASK = '${task}' `)
  console.log(`getCategoryItemsDB - Category: ${category}, Task: ${task}, Visit: ${curVisit}, Results:`, res);
  if (res.length > 0) {
    console.log('Returning VISIT_ITEMS with count:', res.length);
    return res;
  } else {
    console.log('No VISIT_ITEMS found, loading from base ITEMS table');
    return new Promise((resolve, reject) => {
      resolve(db.getAllAsync(`SELECT * FROM ITEMS WHERE CATEGORY = '${category}' AND TASK = '${task}' `));
    }, null, null);
  }
}

export const setItemAllFaces = async (id, faces, DESC, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,ALL_FACES,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${faces}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET ALL_FACES = '${faces}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
}
export const setItemCompanyFaces = async (id, faces, DESC, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,COMPANY_FACES,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${faces}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET COMPANY_FACES = '${faces}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
}

export const setItemSellingPrice = async (id, price, DESC, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,SELLING_PRICE,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${price}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET SELLING_PRICE = '${price}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
}
export const setPricingAttachment = async (id, att, DESC, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,PRICING_ATTACHMENT,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${att}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET PRICING_ATTACHMENT = '${att}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
}
export const setCompProdList = async (id, complist, DESC, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,COMP_PROD_LIST,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${complist}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET COMP_PROD_LIST = '${complist}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
}
export const setExpiryList = async (id, list, DESC, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,EXPIRY_LIST,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${list}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET EXPIRY_LIST = '${list}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
}

export const getCompProdList = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT COMP_PROD_LIST FROM VISIT_ITEMS WHERE ID='${id}' AND VISIT_ID = '${curVisit}' AND CATEGORY = '${category}'`));
  }, null, null);
}

export const getExpList = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT EXPIRY_LIST FROM VISIT_ITEMS WHERE ID='${id}' AND VISIT_ID = '${curVisit}' AND CATEGORY = '${category}'`));
  }, null, null);
}

export const getItemAllFaces = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT ALL_FACES FROM VISIT_ITEMS WHERE ID='${id}' AND VISIT_ID = '${curVisit}' AND CATEGORY = '${category}'`));
  }, null, null);
}
export const getItemCompanyFaces = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT COMPANY_FACES FROM VISIT_ITEMS WHERE ID='${id}' AND VISIT_ID = '${curVisit}' AND CATEGORY = '${category}'`));
  }, null, null);
}

export const getItemSellingPrice = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT SELLING_PRICE FROM VISIT_ITEMS WHERE ID='${id}' AND VISIT_ID = '${curVisit}' AND CATEGORY = '${category}'`));
  }, null, null);
}
export const getPricingAttachment = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT PRICING_ATTACHMENT FROM VISIT_ITEMS WHERE ID='${id}' AND VISIT_ID = '${curVisit}' AND CATEGORY = '${category}'`));
  }, null, null);
}

export const setImagesBefore = async (imgs, id, DESC, TYPE, catID) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,IMAGES_BEFORE,VISIT_ID,CAT_ID) VALUES ('${id}','${DESC}','${TYPE}','${imgs}','${curVisit}','${catID}') ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET IMAGES_BEFORE = '${imgs}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CAT_ID='${catID}' `
  await db.execAsync(query);
}
export const setImagesAfter = async (imgs, id, DESC, TYPE, catID) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,IMAGES_AFTER,VISIT_ID,CAT_ID) VALUES ('${id}','${DESC}','${TYPE}','${imgs}','${curVisit}','${catID}') ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET IMAGES_AFTER = '${imgs}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CAT_ID='${catID}' `
  await db.execAsync(query);
}

export const getFlyerAttachment = async (category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT FLYER_ATTACHMENT FROM VISIT_TASKS WHERE ID='${task}' AND VISIT_ID = '${curVisit}' AND CAT_ID = '${category}'`));
  }, null, null);
}

export const setFlyerAttachment = async (category, task, attachment, DESC, TYPE) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,FLYER_ATTACHMENT,VISIT_ID,CAT_ID) VALUES ('${task}','${DESC}','${TYPE}','${attachment}','${curVisit}','${category}') ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET FLYER_ATTACHMENT = '${attachment}' WHERE ID='${task}' AND VISIT_ID='${curVisit}' AND CAT_ID='${category}' `
  await db.execAsync(query);
}

export const getOffshelfAttachment = async (category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT OFFSHELF_ATTACHMENT FROM VISIT_TASKS WHERE ID='${task}' AND VISIT_ID = '${curVisit}' AND CAT_ID = '${category}'`));
  }, null, null);
}

export const setOffshelfAttachment = async (category, task, attachment, DESC, TYPE) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,OFFSHELF_ATTACHMENT,VISIT_ID,CAT_ID) VALUES ('${task}','${DESC}','${TYPE}','${attachment}','${curVisit}','${category}') ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET OFFSHELF_ATTACHMENT = '${attachment}' WHERE ID='${task}' AND VISIT_ID='${curVisit}' AND CAT_ID='${category}' `
  await db.execAsync(query);
}


export const getCategoriesDB = async () => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const res = db.getAllAsync(`SELECT * FROM VISIT_CATEGORIES WHERE VISIT_ID = '${curVisit}' `)
  if (res.length > 0) {
    return res;
  } else {
    return new Promise((resolve, reject) => {
      resolve(db.getAllAsync('SELECT * FROM CATEGORIES'));
    }, null, null);
  }
}

export const getTaskItemAvl = async (id, category, task) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT ITEM_AVAILABLE FROM VISIT_ITEMS WHERE ID='${id}' AND CATEGORY = '${category}' AND TASK = '${task}' AND VISIT_ID= '${curVisit}'`));
  }, null, null);
}
export const setTaskItemAvl = async (id, itemAvailable, DESC, task, category) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const query = `INSERT INTO VISIT_ITEMS(ID,DESC,ITEM_AVAILABLE,VISIT_ID,CATEGORY,TASK) VALUES ('${id}','${DESC}','${itemAvailable}','${curVisit}','${category}','${task}') ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET ITEM_AVAILABLE = '${itemAvailable}', TASK = '${task}', DESC = '${DESC}' WHERE ID='${id}' AND VISIT_ID='${curVisit}' AND CATEGORY='${category}'`
  await db.execAsync(query);
  console.log(`Item availability saved: ${id}, ${itemAvailable}, Category: ${category}, Task: ${task}`);
}



export const getTaskImagesBefore = async (id, catID) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT IMAGES_BEFORE FROM VISIT_TASKS WHERE ID='${id}' AND CAT_ID = '${catID}' AND VISIT_ID = '${curVisit}'`));
  }, null, null);
}
export const getTaskImagesAfter = async (id, catID) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  return new Promise((resolve, reject) => {
    resolve(db.getAllAsync(`SELECT IMAGES_AFTER FROM VISIT_TASKS WHERE ID='${id}' AND CAT_ID = '${catID}' AND VISIT_ID = '${curVisit}'`));
  }, null, null);
}



export const getTasksDB = async (user, cust, category) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  const res = db.getAllAsync(`SELECT * FROM VISIT_TASKS WHERE CAT_ID = '${category}' AND VISIT_ID = '${curVisit}' `)
  if (res.length > 0) {
    return res;
  } else {
    return new Promise((resolve, reject) => {
      resolve(db.getAllAsync(`SELECT * FROM TASKS WHERE USER_NO LIKE '%${user}%' AND (CUST_CODE LIKE '%${cust}%' OR CUST_CODE IS NULL OR CUST_CODE = '') AND CAT_ID LIKE '%${category}%'`));
    }, null, null);
  }

}

export const addToVisitCategories = async (list) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const curVisit = await getFromAS("curVisitID");
  let qlist = [];
  list.map((line) => {
    qlist.push(
      `insert into VISIT_CATEGORIES(ID,DESC,VISIT_ID) values('${line.ID}','${line.DESC}','${curVisit}') `
    );
  });
  await db.execAsync(qlist.join(";"));
};

export const loadCategories = async (cats) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = ["delete from CATEGORIES"];
  cats.map((line) => {
    qlist.push(
      `insert into CATEGORIES(ID,DESC) values('${line.ID}','${line.DESC}')`
    );
  });
  await db.execAsync(qlist.join(";"));
};
export const addCategoriesToVisit = async (cats) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = [];
  const curVisit = await getFromAS("curVisitID");
  cats.map((line) => {
    qlist.push(
      `insert into VISIT_CATEGORIES(ID,DESC,VISIT_ID) values('${line.ID}','${line.DESC}','${curVisit}') ON CONFLICT(ID,VISIT_ID) DO NOTHING`
    );
  });
  await db.execAsync(qlist.join(";"));
};
export const addTasksToVisit = async (tasks) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = [];
  const curVisit = await getFromAS("curVisitID");
  tasks.map((line) => {
    qlist.push(
      `insert into VISIT_TASKS(ID,
        CREATION_DATE,
        FDT,
        TDT,
        DESC,
        TYPE,
        CUST_CODE,
        USER_NO,
        CAT_ID,
        VISIT_ID,
        IS_OPTIONAL
        ) 
     values('${line.ID}','${line.CREATION_DATE}','${line.FDT}','${line.TDT}','${line.DESC}','${line.TYPE}','${line.CUST_CODE}'
     ,'${line.USER_NO}','${line.CAT_ID}','${curVisit}','${line.IS_OPTIONAL || ""}') ON CONFLICT(ID,CAT_ID,VISIT_ID) DO NOTHING`
    );
  });
  await db.execAsync(qlist.join(";"));
};

export const loadTasks = async (tasks) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  let qlist = ["delete from TASKS"];
  tasks.map((line) => {
    qlist.push(
      `insert into TASKS(ID,
        CREATION_DATE,
        FDT,
        TDT,
        DESC,
        TYPE,
        CUST_CODE,
        USER_NO,
        CAT_ID,
        IS_OPTIONAL
        ) 
     values('${line.ID}','${line.CREATION_DATE}','${line.FDT}','${line.TDT}','${line.DESC}','${line.TYPE}','${line.CUST_CODE}'
     ,'${line.USER_NO}','${line.CAT_ID}','${line.IS_OPTIONAL || ""}')`
    );
  });
  await db.execAsync(qlist.join(";"));
};

export const getTintColor = () =>
  Platform.OS === "android" ? "white" : "black";
export const language = async () => {
  const language = await getFromAS(Constants.language);
  let { locale } = await Localization.getLocalizationAsync();

  if (!locale.startsWith("ar") && !locale.startsWith("en")) {
    locale = "en";
  }
  locale = language == null ? locale : language;
  return locale;
};

export const okAlert = (title, msg, cancelable = true, fnToPerform = null) => {
  Alert.alert(
    title,
    msg,
    [
      {
        text: "ok",
        style: "cancel",
        onPress: fnToPerform,
      },
    ],
    { cancelable }
  );
};

export const okMsgAlert = (msg, cancelable = true, fnToPerform = null) => {
  okAlert(
    Platform.OS === "android" ? "" : msg,
    Platform.OS === "android" ? msg : "",
    cancelable,
    fnToPerform
  );
};

export const confirmAlert = (title, msg, yesFn) => {
  Alert.alert(title, msg, [
    {
      text: "cancel",
      style: "cancel",
    },
    {
      text: "yes",
      onPress: yesFn,
    },
  ]);
};

export const confirmLanguageAlert = (title, msg, yesFn) => {
  Alert.alert(title, msg, [
    {
      text: "cancel",
      style: "cancel",
    },
    {
      text: "yes",
      onPress: yesFn,
    },
  ]);
};

export const saveTimeTracking = async (visitId, categoryId, taskId, timeSpent) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  await db.execAsync(
    `INSERT INTO VISIT_TIME_TRACKING(VISIT_ID, CATEGORY_ID, TASK_ID, TIME_SPENT) 
     VALUES('${visitId}', '${categoryId}', '${taskId}', ${timeSpent}) 
     ON CONFLICT(VISIT_ID, CATEGORY_ID, TASK_ID) 
     DO UPDATE SET TIME_SPENT = TIME_SPENT + ${timeSpent}`
  );
};

export const getTimeTracking = async (visitId, categoryId, taskId) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const result = await db.getFirstAsync(
    `SELECT TIME_SPENT FROM VISIT_TIME_TRACKING 
     WHERE VISIT_ID = '${visitId}' AND CATEGORY_ID = '${categoryId}' AND TASK_ID = '${taskId}'`
  );
  return result ? result.TIME_SPENT : 0;
};

export const getCategoryTimeTracking = async (visitId, categoryId) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });
  const result = await db.getFirstAsync(
    `SELECT SUM(TIME_SPENT) as TOTAL_TIME FROM VISIT_TIME_TRACKING 
     WHERE VISIT_ID = '${visitId}' AND CATEGORY_ID = '${categoryId}'`
  );
  return result && result.TOTAL_TIME ? result.TOTAL_TIME : 0;
};

export const toast = (value, top = true, duration = Toast.durations.SHORT) => {
  Toast.show(value, {
    duration: duration,
    position: top ? Toast.positions.TOP + 72 : -42,
    shadow: true,
    animation: true,
    delay: 0,
  });
};

export const isIphoneX = () => {
  const dimen = Dimensions.get("window");
  return (
    Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 896 ||
      dimen.width === 896)
  );
};

export const getVisitDataForPost = async (visitID) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });

  // Get all tasks for this visit
  const tasks = await db.getAllAsync(`SELECT * FROM VISIT_TASKS WHERE VISIT_ID = '${visitID}'`);

  // Group by category
  const categoryMap = new Map();
  const taskTimeMap = new Map(); // Store task times

  for (const task of tasks) {
    // Split categories by @@ - task can apply to multiple categories
    const categories = task.CAT_ID.split('@@');

    for (const categoryId of categories) {
      // Get time tracking for this task and category
      const timeTracking = await db.getFirstAsync(
        `SELECT TIME_SPENT FROM VISIT_TIME_TRACKING 
         WHERE VISIT_ID = '${visitID}' AND CATEGORY_ID = '${categoryId}' AND TASK_ID = '${task.ID}'`
      );
      const timeSpent = timeTracking ? timeTracking.TIME_SPENT : 0;

      // Store task time
      const taskKey = `${categoryId}_${task.ID}`;
      taskTimeMap.set(taskKey, timeSpent);

      // Initialize category if not exists
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          CAT_ID: categoryId,
          IMAGES_BEFORE: '',
          IMAGES_AFTER: '',
          FLYER_ATTACHMENT: '',
          OFFSHELF_ATTACHMENT: '',
          ITEMS: [],
          TASKS: [] // will collect { TASK_ID, TASK_TIME } entries
        });
      }

      const categoryData = categoryMap.get(categoryId);

      // Create or find the per-task entry inside the category
      let taskEntry = categoryData.TASKS.find(t => t.TASK_ID === task.ID);
      if (!taskEntry) {
        taskEntry = {
          TASK_ID: task.ID,
          DESC: task.DESC || '',
          TYPE: task.TYPE || '',
          TASK_TIME: timeSpent,
          IMAGES_BEFORE: task.IMAGES_BEFORE || '',
          IMAGES_AFTER: task.IMAGES_AFTER || '',
          FLYER_ATTACHMENT: task.FLYER_ATTACHMENT || '',
          OFFSHELF_ATTACHMENT: task.OFFSHELF_ATTACHMENT || '',
          ITEMS: [],
          IS_OPTIONAL: task.IS_OPTIONAL || ''
        };
        categoryData.TASKS.push(taskEntry);
      } else {
        // update task time if found (multiple tasks may map to same ID across iterations)
        taskEntry.TASK_TIME = taskTimeSpent;
        taskEntry.IMAGES_BEFORE = task.IMAGES_BEFORE || taskEntry.IMAGES_BEFORE;
        taskEntry.IMAGES_AFTER = task.IMAGES_AFTER || taskEntry.IMAGES_AFTER;
        taskEntry.FLYER_ATTACHMENT = task.FLYER_ATTACHMENT || taskEntry.FLYER_ATTACHMENT;
        taskEntry.OFFSHELF_ATTACHMENT = task.OFFSHELF_ATTACHMENT || taskEntry.OFFSHELF_ATTACHMENT;
      }

      // Get the task time that was already stored in taskTimeMap
      const taskTimeSpent = taskTimeMap.get(taskKey) || 0;

      // Add a task summary entry to the category's TASKS array (avoid duplicates)
      const categoryEntry = categoryMap.get(categoryId);
      if (categoryEntry) {
        const exists = categoryEntry.TASKS.some(t => t.TASK_ID === task.ID);
        if (!exists) categoryEntry.TASKS.push({ TASK_ID: task.ID, TASK_TIME: taskTimeSpent });
      }

      // Build a complete items list for this task: include base ITEMS (all items) and overlay any VISIT_ITEMS (filled values)
      const visitItemsQuery = `SELECT * FROM VISIT_ITEMS WHERE CATEGORY = '${categoryId}' AND TASK = '${task.ID}' AND VISIT_ID = '${visitID}'`;
      const visitItems = await db.getAllAsync(visitItemsQuery);
      const visitItemsMap = new Map();
      visitItems.forEach(it => visitItemsMap.set(it.ID, it));

      const baseItemsQuery = `SELECT * FROM ITEMS WHERE CATEGORY = '${categoryId}' AND TASK = '${task.ID}'`;
      const baseItems = await db.getAllAsync(baseItemsQuery);

      // First add all base items (these represent 'all items in each task' — even if not filled)
      for (const base of baseItems) {
        const v = visitItemsMap.get(base.ID);
        const itemData = {
          ID: base.ID,
          TASK_ID: task.ID,
          TASK_TIME: taskTimeSpent,
          ALL_FACES: v ? (v.ALL_FACES || '') : '',
          COMPANY_FACES: v ? (v.COMPANY_FACES || '') : '',
          SELLING_PRICE: v ? (v.SELLING_PRICE || '') : '',
          COMP_PROD_LIST: v ? (v.COMP_PROD_LIST || '') : '',
          EXPIRY_LIST: v ? (v.EXPIRY_LIST || '') : '',
          ITEM_AVAILABLE: v ? (v.ITEM_AVAILABLE === 'available' ? 'Y' : v.ITEM_AVAILABLE === 'notAvailable' ? 'N' : '') : ''
        };

        if (v && v.PRICING_ATTACHMENT) itemData.PRICING_ATTACHMENT = v.PRICING_ATTACHMENT;

        taskEntry.ITEMS.push(itemData);
        // mark as consumed
        if (v) visitItemsMap.delete(base.ID);
      }

      // Add any visit_items that are not in base ITEMS (custom/extra filled items)
      for (const extra of visitItems) {
        if (!visitItemsMap.has(extra.ID) && baseItems.some(b => b.ID === extra.ID)) continue; // already processed
        if (visitItemsMap.has(extra.ID)) {
          const item = visitItemsMap.get(extra.ID);
          const itemData = {
            ID: item.ID,
            TASK_ID: task.ID,
            TASK_TIME: taskTimeSpent,
            ALL_FACES: item.ALL_FACES || '',
            COMPANY_FACES: item.COMPANY_FACES || '',
            SELLING_PRICE: item.SELLING_PRICE || '',
            COMP_PROD_LIST: item.COMP_PROD_LIST || '',
            EXPIRY_LIST: item.EXPIRY_LIST || '',
            ITEM_AVAILABLE: item.ITEM_AVAILABLE === 'available' ? 'Y' : item.ITEM_AVAILABLE === 'notAvailable' ? 'N' : ''
          };
          if (item.PRICING_ATTACHMENT) itemData.PRICING_ATTACHMENT = item.PRICING_ATTACHMENT;
          taskEntry.ITEMS.push(itemData);
          visitItemsMap.delete(item.ID);
        }
      }
    }
  }

  // Helper function to upload images and return server URLs
  // Tolerant parser for upload response: JSON, text, or fallback to sent filename
  const tolerantExtractFilenameFromResponse = async (response, fallbackFilename) => {
    // response might be an error sentinel
    if (!response || response === Constants.networkError_code) {
      return { filename: fallbackFilename, ok: false };
    }

    // Try parsing JSON first (many servers return JSON payload with filename)
    if (typeof response.json === 'function') {
      try {
        const json = await response.json();
        if (json) {
          // If the JSON is a string, use it (may be a filename)
          if (typeof json === 'string') {
            // try to extract a filename-like token
            const m = json.match(/([A-Za-z0-9_\-]+\.[A-Za-z0-9]{1,6})/);
            return { filename: m ? m[1] : json.trim(), ok: !!response.ok };
          }

          // If JSON is an array, try to extract from first element
          if (Array.isArray(json) && json.length > 0) {
            const first = json[0];
            if (typeof first === 'string') return { filename: first.trim(), ok: !!response.ok };
            if (typeof first === 'object') {
              const found = first.filename || first.fileName || first.fname || first.name || first.file || (first.data && (first.data.filename || first.data.name));
              if (found) return { filename: found, ok: !!response.ok };
            }
          }

          // If JSON object, look for common keys
          if (typeof json === 'object') {
            const found = json.filename || json.fileName || json.fname || json.name || json.file || (json.data && (json.data.filename || json.data.name));
            if (found) return { filename: found, ok: !!response.ok };
          }
        }
      } catch (e) {
        // ignore JSON parsing errors and try text path below
      }
    }

    // If JSON didn't yield a filename, try response.text() which may contain a filename or a plain string
    if (typeof response.text === 'function') {
      try {
        const text = await response.text();
        if (text && text.trim() !== '') {
          const trimmed = text.trim();
          const m = trimmed.match(/([A-Za-z0-9_\-]+\.[A-Za-z0-9]{1,6})/);
          if (m) return { filename: m[1], ok: true };
          return { filename: trimmed, ok: true };
        }
      } catch (e) {
        // ignore
      }
    }

    // No useful info found — treat as success only if response.ok, otherwise false
    return { filename: fallbackFilename, ok: !!(response && response.ok) };
  };
  const uploadImages = async (imageUris) => {
    if (!imageUris || imageUris === '') return '';

    const uris = imageUris.split('@@');

    const uploadedUrls = [];

    for (const uri of uris) {
      let uploadUri = uri;
      if (uri && uri.trim() !== '') {
        try {
          // If it's already a full HTTP/HTTPS URL, treat as uploaded
          if (uri.startsWith('http://') || uri.startsWith('https://')) {
            uploadedUrls.push(uri);
            continue;
          }

          // If it's a plain filename (no path), check AsyncStorage mapping for original URI
          let mappingKey = null;
          if (!uri.includes('/') && !uri.includes('\\')) {
            const mapped = await getLocalFileMapping(uri);
            if (!mapped) {
              // no local mapping => assume it's already on server
              uploadedUrls.push(_attachmentsBase + '/' + uri);
              continue;
            }
            // local mapping exists — upload from mapped URI
            uploadUri = mapped;
            mappingKey = uri;
          }

          // Determine filename to send (if original entry was a plain filename use it, otherwise use the file's basename)
          const uriParts = uploadUri.split('/');
          const fileBasename = uriParts[uriParts.length - 1];
          const sendFilename = (!uri.includes('/') && !uri.includes('\\')) ? uri : fileBasename;

          const file = { uri: uploadUri, name: sendFilename, type: '*/*' };
          const response = await ServerOperations.pickUploadHttpRequest(file, 1);

          // Determine returned filename from server response if available
          let savedFilename = sendFilename;
          let uploadSucceeded = false;
          try {
            if (response && response !== Constants.networkError_code) {
              // tolerant parser: try JSON, then text, then regex; if nothing found fall back to sendFilename
              const parsed = await tolerantExtractFilenameFromResponse(response, sendFilename);
              if (parsed && parsed.filename) savedFilename = parsed.filename;
              uploadSucceeded = !!parsed && !!parsed.ok;
            }
          } catch (e) {
            // Be tolerant: don't crash on parse errors - we'll fall back to sendFilename
            console.log('Failed to parse upload response:', e);
          }

          const url = _attachmentsBase + '/' + savedFilename;
          uploadedUrls.push(url);
          // If we uploaded a local mapping, remove that mapping so next time it's treated as server-hosted
          if (mappingKey && uploadSucceeded) {
            // only remove mapping if upload definitely succeeded
            await removeLocalFileMapping(mappingKey);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }

    // Join uploaded server URLs using the same separator and return
    return uploadedUrls.join('@@');
  };

  // Helper function to upload single attachment and return server URL
  const uploadAttachment = async (fileUri) => {
    if (!fileUri || fileUri === '') return '';

    try {
      // If it's already a full HTTP/HTTPS URL, return it
      if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
        return fileUri;
      }

      // If it's a plain filename (no path), check for local copy; otherwise assume it's on server
      let uploadUri = fileUri;
      let mappingKey = null;
      if (!fileUri.includes('/') && !fileUri.includes('\\')) {
        const mapped = await getLocalFileMapping(fileUri);
        if (!mapped) {
          return _attachmentsBase + '/' + fileUri;
        }
        uploadUri = mapped;
        mappingKey = fileUri;
      }

      // Determine filename to send (use plain filename if provided, else use basename from uploadUri)
      const uriParts = uploadUri.split('/');
      const fileBasename = uriParts[uriParts.length - 1];
      const sendFilename = (!fileUri.includes('/') && !fileUri.includes('\\')) ? fileUri : fileBasename;

      const file = { uri: uploadUri, name: sendFilename, type: '*/*' };
      const response = await ServerOperations.pickUploadHttpRequest(file, 1);

      // Extract saved filename using tolerant parser, fall back to generated name on error
      let savedFilename = sendFilename;
      let uploadSucceeded = false;
      try {
        if (response && response !== Constants.networkError_code) {
          const parsed = await tolerantExtractFilenameFromResponse(response, sendFilename);
          if (parsed && parsed.filename) savedFilename = parsed.filename;
          uploadSucceeded = !!parsed && !!parsed.ok;
        }
      } catch (e) {
        console.log('Failed to parse upload response:', e);
      }

      // remove mapping if upload was successful for a mapped file
      if (mappingKey && uploadSucceeded) await removeLocalFileMapping(mappingKey);
      return _attachmentsBase + '/' + savedFilename;
    } catch (error) {
      console.error('Error uploading attachment:', error);
    }
    return fileUri;
  };

  // Upload per-task images/attachments and then item attachments
  for (const [categoryId, categoryData] of categoryMap.entries()) {
    for (const t of categoryData.TASKS) {
      if (t.IMAGES_BEFORE) {
        t.IMAGES_BEFORE = await uploadImages(t.IMAGES_BEFORE);
      }
      if (t.IMAGES_AFTER) {
        t.IMAGES_AFTER = await uploadImages(t.IMAGES_AFTER);
      }
      if (t.FLYER_ATTACHMENT) {
        t.FLYER_ATTACHMENT = await uploadAttachment(t.FLYER_ATTACHMENT);
      }
      if (t.OFFSHELF_ATTACHMENT) {
        t.OFFSHELF_ATTACHMENT = await uploadAttachment(t.OFFSHELF_ATTACHMENT);
      }

      // Upload item-level attachments under this task
      for (const item of t.ITEMS) {
        if (item.PRICING_ATTACHMENT) {
          item.PRICING_ATTACHMENT = await uploadAttachment(item.PRICING_ATTACHMENT);
        }
        if (item.ATTACHMENT) {
          item.ATTACHMENT = await uploadAttachment(item.ATTACHMENT);
        }
      }
    }
  }

  // Convert map to array and produce tasks-first payload:
  // tasksData = [ { TASK_ID, TASK_TIME, DESC, TYPE, CAT_ID, CATEGORY_TIME, IMAGES_BEFORE, ... ITEMS } ]
  const categoriesArray = Array.from(categoryMap.values()).map(cat => {
    // Build filtered tasks array for final payload
    const tasksWithData = cat.TASKS.map(task => {
      // Include ALL items for each task (including unfilled/base items)
      const itemsAll = (task.ITEMS || []);

      // Strip TASK_ID/TASK_TIME from items in final output (task info is already at top-level)
      const itemsClean = itemsAll.map(it => {
        const { TASK_ID, TASK_TIME, ...rest } = it;
        return rest;
      });

      return {
        TASK_ID: task.TASK_ID,
        TASK_TIME: task.TASK_TIME || 0,
        DESC: task.DESC || '',
        TYPE: task.TYPE || '',
        IMAGES_BEFORE: task.IMAGES_BEFORE || '',
        IMAGES_AFTER: task.IMAGES_AFTER || '',
        FLYER_ATTACHMENT: task.FLYER_ATTACHMENT || '',
        OFFSHELF_ATTACHMENT: task.OFFSHELF_ATTACHMENT || '',
        IS_OPTIONAL: task.IS_OPTIONAL || '',
        ITEMS: itemsClean
      };
    }).filter(t => {
      // Keep tasks that have any meaningful data (items or attachments)
      return (t.ITEMS && t.ITEMS.length > 0) || t.IMAGES_BEFORE || t.IMAGES_AFTER || t.FLYER_ATTACHMENT || t.OFFSHELF_ATTACHMENT;
    });

    // Calculate total category time from unique task times in TASKS
    const uniqueTaskTimes = new Map();
    cat.TASKS.forEach(task => {
      if (!uniqueTaskTimes.has(task.TASK_ID)) {
        uniqueTaskTimes.set(task.TASK_ID, task.TASK_TIME || 0);
      }
    });
    const totalCategoryTime = Array.from(uniqueTaskTimes.values()).reduce((sum, time) => sum + time, 0);

    return {
      CAT_ID: cat.CAT_ID,
      CATEGORY_TIME: totalCategoryTime,
      TASKS: tasksWithData
    };
  })
    .filter(cat => {
      // Only include categories that have tasks with any data
      return cat.TASKS && cat.TASKS.length > 0;
    });

  // Build a flattened tasks-first payload and development-time checks
  const tasksData = [];
  for (const cat of categoriesArray) {
    const catTime = cat.CATEGORY_TIME || 0;
    if (!cat.TASKS || !Array.isArray(cat.TASKS)) continue;
    for (const t of cat.TASKS) {
      const taskObj = Object.assign({}, t, { CAT_ID: cat.CAT_ID, CATEGORY_TIME: catTime });
      tasksData.push(taskObj);
    }
  }

  // Development-time checks (non-blocking) to ensure tasks payload contains expected fields
  try {
    tasksData.forEach(t => {
      if (typeof t.TASK_ID === 'undefined' || typeof t.TASK_TIME === 'undefined') console.warn('Task missing TASK_ID/TASK_TIME', t.TASK_ID, t.CAT_ID);
      if (t.ITEMS && Array.isArray(t.ITEMS)) {
        t.ITEMS.forEach(it => {
          if (!it.ID) console.warn('Item missing ID in task', t.CAT_ID, t.TASK_ID, it);
        });
      }
    });
  } catch (e) {
    // keep quiet if checks fail
  }

  // Return a tasks-first payload
  return tasksData;
};

export const loadVisitFromJson = async (visitData) => {
  const db = await SQLite.openDatabaseAsync("merch.db", { useNewConnection: true });

  try {
    const { VISIT_ID, CUSTOMER, USER, IN_TIME, OUT_TIME, NOTES, IS_POSTED, CATEGORIES } = visitData;

    // Add to visit summary
    const seq = VISIT_ID.split("-")[1];
    const status = IS_POSTED === 'Y' ? 'posted' : 'pending';
    const query = `INSERT INTO VISIT_SUMMARY(SEQ,ID,USER,CUSTOMER,IN_TIME,OUT_TIME,NOTES,STATUS)
     VALUES ('${seq}','${VISIT_ID}','${USER}','${CUSTOMER}','${IN_TIME}','${OUT_TIME}','${NOTES || ''}','${status}') 
     ON CONFLICT(ID) DO UPDATE SET USER='${USER}',CUSTOMER='${CUSTOMER}',IN_TIME='${IN_TIME}',OUT_TIME='${OUT_TIME}',NOTES='${NOTES || ''}',STATUS='${status}'`;
    await db.execAsync(query);

    // Prepare categories input - support two formats:
    // 1) legacy: CATEGORIES array in visitData
    // 2) new: top-level TASKS array in visitData -> group tasks by CAT_ID
    let categoriesInput = CATEGORIES;
    if ((!categoriesInput || !Array.isArray(categoriesInput)) && visitData.TASKS && Array.isArray(visitData.TASKS)) {
      // group tasks into categories
      const byCat = new Map();
      for (const t of visitData.TASKS) {
        const catId = t.CAT_ID || t.CATEGORY || '';
        if (!byCat.has(catId)) byCat.set(catId, { CATEGORY: catId, TASKS: [] });
        byCat.get(catId).TASKS.push(t);
      }
      categoriesInput = Array.from(byCat.values());
    }

    // Process each category
    for (const category of (categoriesInput || [])) {
      // Support both legacy (CATEGORY) and new (CAT_ID) formats
      const catId = category.CATEGORY || category.CAT_ID;
      const PHOTOS_BEFORE = category.PHOTOS_BEFORE || category.IMAGES_BEFORE || '';
      const PHOTOS_AFTER = category.PHOTOS_AFTER || category.IMAGES_AFTER || '';
      const FLYER_ATTACHMENT = category.FLYER_ATTACHMENT || '';
      const OFFSHELF_ATTACHMENT = category.OFFSHELF_ATTACHMENT || '';
      let ITEMS = category.ITEMS || [];
      let TASKS = category.TASKS || [];

      // Handle category-level TASK_ID / TASK_TIME / CATEGORY_TIME
      // If category has a TASK_ID but no TASKS array, synthesize a single task entry
      const categoryLevelTaskId = category.TASK_ID || category.TASKID || '';
      const categoryLevelTaskTime = (category.TASK_TIME !== undefined && category.TASK_TIME !== null && category.TASK_TIME !== '') ? category.TASK_TIME : (category.CATEGORY_TIME !== undefined && category.CATEGORY_TIME !== null && category.CATEGORY_TIME !== '' ? category.CATEGORY_TIME : '');
      if ((!TASKS || TASKS.length === 0) && categoryLevelTaskId) {
        // Build synthetic task from category-level fields
        TASKS = [{
          TASK_ID: categoryLevelTaskId,
          TASK_TIME: categoryLevelTaskTime || '',
          DESC: category.DESC || '',
          TYPE: category.TYPE || '',
          IMAGES_BEFORE: PHOTOS_BEFORE || '',
          IMAGES_AFTER: PHOTOS_AFTER || '',
          FLYER_ATTACHMENT: FLYER_ATTACHMENT || '',
          OFFSHELF_ATTACHMENT: OFFSHELF_ATTACHMENT || '',
          ITEMS: ITEMS || [],
          IS_OPTIONAL: category.IS_OPTIONAL || ''
        }];

        // items are already attached to the synthetic task's ITEMS — prevent double-processing
        ITEMS = [];
      }

      // If new format provides per-task objects, process them first
      if (TASKS && Array.isArray(TASKS) && TASKS.length > 0) {
        for (const t of TASKS) {
          try {
            const tid = t.TASK_ID || t.ID || t.TASKID || '';
            const tdesc = t.DESC || '';
            const ttype = t.TYPE || '';
            const tIsOptional = t.IS_OPTIONAL || t.is_optional || '';

            const normalizedBefore = t.IMAGES_BEFORE ? (typeof t.IMAGES_BEFORE === 'string' ? t.IMAGES_BEFORE.split('@@').map(normalizeAttachmentValue).filter(Boolean).join('@@') : '') : '';
            const normalizedAfter = t.IMAGES_AFTER ? (typeof t.IMAGES_AFTER === 'string' ? t.IMAGES_AFTER.split('@@').map(normalizeAttachmentValue).filter(Boolean).join('@@') : '') : '';
            const normalizedFlyer = t.FLYER_ATTACHMENT ? normalizeAttachmentValue(t.FLYER_ATTACHMENT) : '';
            const normalizedOffshelf = t.OFFSHELF_ATTACHMENT ? normalizeAttachmentValue(t.OFFSHELF_ATTACHMENT) : '';

            if (tid) {
              const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,IMAGES_BEFORE,IMAGES_AFTER,FLYER_ATTACHMENT,OFFSHELF_ATTACHMENT,VISIT_ID,CAT_ID,IS_OPTIONAL) 
               VALUES ('${tid}','${tdesc}','${ttype}','${normalizedBefore}','${normalizedAfter}','${normalizedFlyer}','${normalizedOffshelf}','${VISIT_ID}','${catId}','${tIsOptional}') 
               ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET IMAGES_BEFORE='${normalizedBefore}', IMAGES_AFTER='${normalizedAfter}', FLYER_ATTACHMENT='${normalizedFlyer}', OFFSHELF_ATTACHMENT='${normalizedOffshelf}'`;
              await db.execAsync(taskQuery);
            }

            // persist TASK_TIME if present
            if (t.TASK_TIME && t.TASK_TIME !== '' && !isNaN(t.TASK_TIME) && tid) {
              const timeTrackingQuery = `INSERT INTO VISIT_TIME_TRACKING(VISIT_ID, CATEGORY_ID, TASK_ID, TIME_SPENT) 
               VALUES('${VISIT_ID}', '${catId}', '${tid}', ${Number(t.TASK_TIME)}) 
               ON CONFLICT(VISIT_ID, CATEGORY_ID, TASK_ID) 
               DO UPDATE SET TIME_SPENT = ${Number(t.TASK_TIME)}`;
              await db.execAsync(timeTrackingQuery);
            }

            // Process items for this task if present
            if (t.ITEMS && Array.isArray(t.ITEMS)) {
              for (const item of t.ITEMS) {
                const { ID, TASK_ID: itemTaskId, TASK_TIME, ALL_FACES, COMPANY_FACES, SELLING_PRICE, COMP_PROD_LIST, EXPIRY_LIST, ITEM_AVAILABLE, PRICING_ATTACHMENT, ATTACHMENT } = item;
                const iTaskId = itemTaskId || tid || '';
                const itemDescQuery = `SELECT DESC FROM ITEMS WHERE ID='${ID}' AND CATEGORY='${catId}' LIMIT 1`;
                const itemDescs = await db.getAllAsync(itemDescQuery);
                const itemDesc = itemDescs.length > 0 ? itemDescs[0].DESC : '';
                const availability = ITEM_AVAILABLE === 'Y' ? 'available' : ITEM_AVAILABLE === 'N' ? 'notAvailable' : '';
                const pricingAttachment = PRICING_ATTACHMENT ? normalizeAttachmentValue(PRICING_ATTACHMENT) : '';
                const attach = ATTACHMENT ? normalizeAttachmentValue(ATTACHMENT) : '';

                const itemQuery = `INSERT INTO VISIT_ITEMS(ID,DESC,CATEGORY,TASK,ALL_FACES,COMPANY_FACES,SELLING_PRICE,COMP_PROD_LIST,EXPIRY_LIST,VISIT_ID,ITEM_AVAILABLE,PRICING_ATTACHMENT) 
                 VALUES ('${ID}','${itemDesc}','${catId}','${iTaskId}','${ALL_FACES || ''}','${COMPANY_FACES || ''}','${SELLING_PRICE || ''}','${COMP_PROD_LIST || ''}','${EXPIRY_LIST || ''}','${VISIT_ID}','${availability}','${pricingAttachment}') 
                 ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET 
                 TASK='${iTaskId}',
                 ALL_FACES='${ALL_FACES || ''}',
                 COMPANY_FACES='${COMPANY_FACES || ''}',
                 SELLING_PRICE='${SELLING_PRICE || ''}',
                 COMP_PROD_LIST='${COMP_PROD_LIST || ''}',
                 EXPIRY_LIST='${EXPIRY_LIST || ''}',
                 ITEM_AVAILABLE='${availability}',
                 PRICING_ATTACHMENT='${pricingAttachment}'`;
                await db.execAsync(itemQuery);

                // Save task time tracking: prefer item-level TASK_TIME if present; otherwise fall back to parent task time
                let timeToSave = null;
                if (TASK_TIME !== undefined && TASK_TIME !== null && TASK_TIME !== '' && !isNaN(TASK_TIME)) {
                  timeToSave = Number(TASK_TIME);
                } else if (t && t.TASK_TIME !== undefined && t.TASK_TIME !== null && t.TASK_TIME !== '' && !isNaN(t.TASK_TIME)) {
                  timeToSave = Number(t.TASK_TIME);
                }

                if (timeToSave !== null && iTaskId) {
                  const timeTrackingQuery = `INSERT INTO VISIT_TIME_TRACKING(VISIT_ID, CATEGORY_ID, TASK_ID, TIME_SPENT) 
                   VALUES('${VISIT_ID}', '${catId}', '${iTaskId}', ${timeToSave}) 
                   ON CONFLICT(VISIT_ID, CATEGORY_ID, TASK_ID) 
                   DO UPDATE SET TIME_SPENT = ${timeToSave}`;
                  await db.execAsync(timeTrackingQuery);
                }
              }
            }
          } catch (e) {
            // ignore malformed task entries
          }
        }
      }

      // Find tasks related to this category's data
      // Photos task
      if (PHOTOS_BEFORE || PHOTOS_AFTER) {
        const photosTaskQuery = `SELECT * FROM TASKS WHERE CAT_ID LIKE '%${catId}%' AND TYPE = 'Photos' LIMIT 1`;
        const photosTasks = await db.getAllAsync(photosTaskQuery);
        if (photosTasks.length > 0) {
          const task = photosTasks[0];
          const normalizedBefore = PHOTOS_BEFORE ? PHOTOS_BEFORE.split('@@').map(normalizeAttachmentValue).filter(Boolean).join('@@') : '';
          const normalizedAfter = PHOTOS_AFTER ? PHOTOS_AFTER.split('@@').map(normalizeAttachmentValue).filter(Boolean).join('@@') : '';
          const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,IMAGES_BEFORE,IMAGES_AFTER,VISIT_ID,CAT_ID,IS_OPTIONAL) 
           VALUES ('${task.ID}','${task.DESC}','${task.TYPE}','${normalizedBefore}','${normalizedAfter}','${VISIT_ID}','${catId}','${task.IS_OPTIONAL || ''}') 
           ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET IMAGES_BEFORE='${normalizedBefore}', IMAGES_AFTER='${normalizedAfter}'`;
          await db.execAsync(taskQuery);
        }
      }

      // Flyer task
      if (FLYER_ATTACHMENT) {
        const flyerTaskQuery = `SELECT * FROM TASKS WHERE CAT_ID LIKE '%${catId}%' AND TYPE = 'Flyer' LIMIT 1`;
        const flyerTasks = await db.getAllAsync(flyerTaskQuery);
        if (flyerTasks.length > 0) {
          const task = flyerTasks[0];
          const normalizedFlyer = normalizeAttachmentValue(FLYER_ATTACHMENT);
          const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,FLYER_ATTACHMENT,VISIT_ID,CAT_ID,IS_OPTIONAL) 
           VALUES ('${task.ID}','${task.DESC}','${task.TYPE}','${normalizedFlyer}','${VISIT_ID}','${catId}','${task.IS_OPTIONAL || ''}') 
           ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET FLYER_ATTACHMENT='${normalizedFlyer}'`;
          await db.execAsync(taskQuery);
        }
      }

      // Offshelf task
      if (OFFSHELF_ATTACHMENT) {
        const offshelfTaskQuery = `SELECT * FROM TASKS WHERE CAT_ID LIKE '%${catId}%' AND TYPE = 'Offshelf' LIMIT 1`;
        const offshelfTasks = await db.getAllAsync(offshelfTaskQuery);
        if (offshelfTasks.length > 0) {
          const task = offshelfTasks[0];
          const normalizedOffshelf = normalizeAttachmentValue(OFFSHELF_ATTACHMENT);
          const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,OFFSHELF_ATTACHMENT,VISIT_ID,CAT_ID,IS_OPTIONAL) 
           VALUES ('${task.ID}','${task.DESC}','${task.TYPE}','${normalizedOffshelf}','${VISIT_ID}','${catId}','${task.IS_OPTIONAL || ''}') 
           ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET OFFSHELF_ATTACHMENT='${normalizedOffshelf}'`;
          await db.execAsync(taskQuery);
        }
      }

      // Process items
      for (const item of ITEMS) {
        const { ID, TASK_ID, TASK_TIME, ALL_FACES, COMPANY_FACES, SELLING_PRICE, COMP_PROD_LIST, EXPIRY_LIST, ITEM_AVAILABLE, PRICING_ATTACHMENT } = item;

        // Items may omit TASK_ID - fall back to category-level TASK_ID if present
        const assignedTaskId = TASK_ID || categoryLevelTaskId || '';

        // Get item description from base ITEMS table
        const itemDescQuery = `SELECT DESC FROM ITEMS WHERE ID='${ID}' AND CATEGORY='${catId}' LIMIT 1`;
        const itemDescs = await db.getAllAsync(itemDescQuery);
        const itemDesc = itemDescs.length > 0 ? itemDescs[0].DESC : '';

        // Convert Y/N back to available/notAvailable
        const availability = ITEM_AVAILABLE === 'Y' ? 'available' : ITEM_AVAILABLE === 'N' ? 'notAvailable' : '';

        const pricingAttachment = PRICING_ATTACHMENT ? normalizeAttachmentValue(PRICING_ATTACHMENT) : '';

        const itemQuery = `INSERT INTO VISIT_ITEMS(ID,DESC,CATEGORY,TASK,ALL_FACES,COMPANY_FACES,SELLING_PRICE,COMP_PROD_LIST,EXPIRY_LIST,VISIT_ID,ITEM_AVAILABLE,PRICING_ATTACHMENT) 
         VALUES ('${ID}','${itemDesc}','${catId}','${assignedTaskId}','${ALL_FACES || ''}','${COMPANY_FACES || ''}','${SELLING_PRICE || ''}','${COMP_PROD_LIST || ''}','${EXPIRY_LIST || ''}','${VISIT_ID}','${availability}','${pricingAttachment}') 
         ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET 
         TASK='${assignedTaskId}',
         ALL_FACES='${ALL_FACES || ''}',
         COMPANY_FACES='${COMPANY_FACES || ''}',
         SELLING_PRICE='${SELLING_PRICE || ''}',
         COMP_PROD_LIST='${COMP_PROD_LIST || ''}',
         EXPIRY_LIST='${EXPIRY_LIST || ''}',
         ITEM_AVAILABLE='${availability}',
         PRICING_ATTACHMENT='${pricingAttachment}'`;
        await db.execAsync(itemQuery);

        // Save task time tracking if available; prefer item-level TASK_TIME, then category-level task time, then category-level CATEGORY_TIME
        let assignedTaskTime = null;
        if (TASK_TIME !== undefined && TASK_TIME !== null && TASK_TIME !== '' && !isNaN(TASK_TIME)) assignedTaskTime = Number(TASK_TIME);
        else if (categoryLevelTaskTime !== undefined && categoryLevelTaskTime !== null && categoryLevelTaskTime !== '' && !isNaN(categoryLevelTaskTime)) assignedTaskTime = Number(categoryLevelTaskTime);

        if (assignedTaskTime !== null && assignedTaskId) {
          const timeTrackingQuery = `INSERT INTO VISIT_TIME_TRACKING(VISIT_ID, CATEGORY_ID, TASK_ID, TIME_SPENT) 
           VALUES('${VISIT_ID}', '${catId}', '${assignedTaskId}', ${assignedTaskTime}) 
           ON CONFLICT(VISIT_ID, CATEGORY_ID, TASK_ID) 
           DO UPDATE SET TIME_SPENT = ${assignedTaskTime}`;
          await db.execAsync(timeTrackingQuery);
        }
      }

      // (TASKS if present already handled above)
    }

    return { success: true };
  } catch (error) {
    console.error('Error loading visit from JSON:', error);
    return { success: false, error: error.message };
  }
};

//export const isArabic = () => STRINGS.curLanguage.startsWith("ar");
