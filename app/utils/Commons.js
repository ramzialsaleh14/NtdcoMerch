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
import * as SQLite from "expo-sqlite";
import * as ServerOperations from "./ServerOperations";
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
  customers.map((line) => {
    qlist.push(
      `insert into CUSTOMERS(CODE,NAME,LOCATION) values('${line.CODE}','${line.NAME}','${line.LOCATION}') ON CONFLICT(CODE) DO UPDATE SET NAME='${line.NAME}', LOCATION='${line.LOCATION}' WHERE CODE='${line.CODE}'`
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
    if (serverLastSeq > localLastSeq) {
      console.log('Server has newer visits, syncing...');

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
          ITEMS: []
        });
      }

      const categoryData = categoryMap.get(categoryId);

      // Accumulate task-level data with separate attachment types
      if (task.IMAGES_BEFORE) categoryData.IMAGES_BEFORE = task.IMAGES_BEFORE;
      if (task.IMAGES_AFTER) categoryData.IMAGES_AFTER = task.IMAGES_AFTER;

      // Separate attachments by task type - use dedicated columns
      if (task.FLYER_ATTACHMENT) {
        categoryData.FLYER_ATTACHMENT = task.FLYER_ATTACHMENT;
      }
      if (task.OFFSHELF_ATTACHMENT) {
        categoryData.OFFSHELF_ATTACHMENT = task.OFFSHELF_ATTACHMENT;
      }

      // Get the task time that was already stored in taskTimeMap
      const taskTimeSpent = taskTimeMap.get(taskKey) || 0;

      // Get items for this task and category
      const itemsQuery = `SELECT * FROM VISIT_ITEMS WHERE CATEGORY = '${categoryId}' AND TASK = '${task.ID}' AND VISIT_ID = '${visitID}'`;
      const items = await db.getAllAsync(itemsQuery);

      for (const item of items) {
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

        // Add pricing attachment from dedicated column
        if (item.PRICING_ATTACHMENT) {
          itemData.PRICING_ATTACHMENT = item.PRICING_ATTACHMENT;
        }

        categoryData.ITEMS.push(itemData);
      }
    }
  }

  // Helper function to upload images but keep URIs in data
  const uploadImages = async (imageUris) => {
    if (!imageUris || imageUris === '') return '';

    const uris = imageUris.split('@@');

    for (const uri of uris) {
      if (uri && uri.trim() !== '') {
        try {
          // Skip if it's already just a filename
          if (!uri.includes('/') && !uri.includes('\\')) {
            continue;
          }

          // Extract filename from URI or generate new one
          const uriParts = uri.split('/');
          const originalName = uriParts[uriParts.length - 1];
          const timestamp = new Date().getTime();
          const extension = originalName.substring(originalName.lastIndexOf('.'));
          const newFilename = timestamp + extension;

          const file = { uri, name: newFilename, type: '*/*' };
          await ServerOperations.pickUploadHttpRequest(file, 1);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }

    // Return original URIs, not filenames
    return imageUris;
  };

  // Helper function to upload single attachment but keep URI in data
  const uploadAttachment = async (fileUri) => {
    if (!fileUri || fileUri === '') return '';

    try {
      // Skip if it's already just a filename
      if (!fileUri.includes('/') && !fileUri.includes('\\')) {
        return fileUri;
      }

      // Extract filename from URI or generate new one
      const uriParts = fileUri.split('/');
      const originalName = uriParts[uriParts.length - 1];
      const timestamp = new Date().getTime();
      const extension = originalName.substring(originalName.lastIndexOf('.'));
      const newFilename = timestamp + extension;

      const file = { uri: fileUri, name: newFilename, type: '*/*' };
      await ServerOperations.pickUploadHttpRequest(file, 1);
    } catch (error) {
      console.error('Error uploading attachment:', error);
    }

    // Return original URI, not filename
    return fileUri;
  };

  // Upload all images before/after and attachments for each category
  for (const [categoryId, categoryData] of categoryMap.entries()) {
    if (categoryData.IMAGES_BEFORE) {
      categoryData.IMAGES_BEFORE = await uploadImages(categoryData.IMAGES_BEFORE);
    }
    if (categoryData.IMAGES_AFTER) {
      categoryData.IMAGES_AFTER = await uploadImages(categoryData.IMAGES_AFTER);
    }
    if (categoryData.FLYER_ATTACHMENT) {
      categoryData.FLYER_ATTACHMENT = await uploadAttachment(categoryData.FLYER_ATTACHMENT);
    }
    if (categoryData.OFFSHELF_ATTACHMENT) {
      categoryData.OFFSHELF_ATTACHMENT = await uploadAttachment(categoryData.OFFSHELF_ATTACHMENT);
    }

    // Upload item-level attachments
    for (const item of categoryData.ITEMS) {
      if (item.PRICING_ATTACHMENT) {
        item.PRICING_ATTACHMENT = await uploadAttachment(item.PRICING_ATTACHMENT);
      }
      if (item.ATTACHMENT) {
        item.ATTACHMENT = await uploadAttachment(item.ATTACHMENT);
      }
    }
  }

  // Convert map to array and filter out empty categories
  const categoriesData = Array.from(categoryMap.values())
    .map(cat => {
      // Filter out items that have no meaningful data (only ID and TASK_ID)
      const itemsWithData = cat.ITEMS.filter(item => {
        return item.ALL_FACES || item.COMPANY_FACES || item.SELLING_PRICE ||
          item.COMP_PROD_LIST || item.EXPIRY_LIST || item.ITEM_AVAILABLE ||
          item.PRICING_ATTACHMENT || item.ATTACHMENT;
      });

      // Calculate total category time from unique task times in items
      const uniqueTaskTimes = new Map();
      cat.ITEMS.forEach(item => {
        if (!uniqueTaskTimes.has(item.TASK_ID)) {
          uniqueTaskTimes.set(item.TASK_ID, item.TASK_TIME || 0);
        }
      });
      const totalCategoryTime = Array.from(uniqueTaskTimes.values()).reduce((sum, time) => sum + time, 0);

      return {
        CAT_ID: cat.CAT_ID,
        IMAGES_BEFORE: cat.IMAGES_BEFORE,
        IMAGES_AFTER: cat.IMAGES_AFTER,
        FLYER_ATTACHMENT: cat.FLYER_ATTACHMENT,
        OFFSHELF_ATTACHMENT: cat.OFFSHELF_ATTACHMENT,
        CATEGORY_TIME: totalCategoryTime,
        ITEMS: itemsWithData
      };
    })
    .filter(cat => {
      // Only include categories that have images, attachments, or items with data
      return cat.IMAGES_BEFORE !== '' ||
        cat.IMAGES_AFTER !== '' ||
        cat.FLYER_ATTACHMENT !== '' ||
        cat.OFFSHELF_ATTACHMENT !== '' ||
        cat.ITEMS.length > 0;
    });

  return categoriesData;
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

    // Process each category
    for (const category of CATEGORIES) {
      const { CATEGORY: catId, PHOTOS_BEFORE, PHOTOS_AFTER, FLYER_ATTACHMENT, OFFSHELF_ATTACHMENT, ITEMS } = category;

      // Find tasks related to this category's data
      // Photos task
      if (PHOTOS_BEFORE || PHOTOS_AFTER) {
        const photosTaskQuery = `SELECT * FROM TASKS WHERE CAT_ID LIKE '%${catId}%' AND TYPE = 'Photos' LIMIT 1`;
        const photosTasks = await db.getAllAsync(photosTaskQuery);
        if (photosTasks.length > 0) {
          const task = photosTasks[0];
          const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,IMAGES_BEFORE,IMAGES_AFTER,VISIT_ID,CAT_ID,IS_OPTIONAL) 
           VALUES ('${task.ID}','${task.DESC}','${task.TYPE}','${PHOTOS_BEFORE || ''}','${PHOTOS_AFTER || ''}','${VISIT_ID}','${catId}','${task.IS_OPTIONAL || ''}') 
           ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET IMAGES_BEFORE='${PHOTOS_BEFORE || ''}', IMAGES_AFTER='${PHOTOS_AFTER || ''}'`;
          await db.execAsync(taskQuery);
        }
      }

      // Flyer task
      if (FLYER_ATTACHMENT) {
        const flyerTaskQuery = `SELECT * FROM TASKS WHERE CAT_ID LIKE '%${catId}%' AND TYPE = 'Flyer' LIMIT 1`;
        const flyerTasks = await db.getAllAsync(flyerTaskQuery);
        if (flyerTasks.length > 0) {
          const task = flyerTasks[0];
          const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,FLYER_ATTACHMENT,VISIT_ID,CAT_ID,IS_OPTIONAL) 
           VALUES ('${task.ID}','${task.DESC}','${task.TYPE}','${FLYER_ATTACHMENT}','${VISIT_ID}','${catId}','${task.IS_OPTIONAL || ''}') 
           ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET FLYER_ATTACHMENT='${FLYER_ATTACHMENT}'`;
          await db.execAsync(taskQuery);
        }
      }

      // Offshelf task
      if (OFFSHELF_ATTACHMENT) {
        const offshelfTaskQuery = `SELECT * FROM TASKS WHERE CAT_ID LIKE '%${catId}%' AND TYPE = 'Offshelf' LIMIT 1`;
        const offshelfTasks = await db.getAllAsync(offshelfTaskQuery);
        if (offshelfTasks.length > 0) {
          const task = offshelfTasks[0];
          const taskQuery = `INSERT INTO VISIT_TASKS(ID,DESC,TYPE,OFFSHELF_ATTACHMENT,VISIT_ID,CAT_ID,IS_OPTIONAL) 
           VALUES ('${task.ID}','${task.DESC}','${task.TYPE}','${OFFSHELF_ATTACHMENT}','${VISIT_ID}','${catId}','${task.IS_OPTIONAL || ''}') 
           ON CONFLICT(ID,CAT_ID,VISIT_ID) DO UPDATE SET OFFSHELF_ATTACHMENT='${OFFSHELF_ATTACHMENT}'`;
          await db.execAsync(taskQuery);
        }
      }

      // Process items
      for (const item of ITEMS) {
        const { ID, TASK_ID, TASK_TIME, ALL_FACES, COMPANY_FACES, SELLING_PRICE, COMP_PROD_LIST, EXPIRY_LIST, ITEM_AVAILABLE, PRICING_ATTACHMENT } = item;

        // Get item description from base ITEMS table
        const itemDescQuery = `SELECT DESC FROM ITEMS WHERE ID='${ID}' AND CATEGORY='${catId}' LIMIT 1`;
        const itemDescs = await db.getAllAsync(itemDescQuery);
        const itemDesc = itemDescs.length > 0 ? itemDescs[0].DESC : '';

        // Convert Y/N back to available/notAvailable
        const availability = ITEM_AVAILABLE === 'Y' ? 'available' : ITEM_AVAILABLE === 'N' ? 'notAvailable' : '';

        const pricingAttachment = PRICING_ATTACHMENT || '';

        const itemQuery = `INSERT INTO VISIT_ITEMS(ID,DESC,CATEGORY,TASK,ALL_FACES,COMPANY_FACES,SELLING_PRICE,COMP_PROD_LIST,EXPIRY_LIST,VISIT_ID,ITEM_AVAILABLE,PRICING_ATTACHMENT) 
         VALUES ('${ID}','${itemDesc}','${catId}','${TASK_ID}','${ALL_FACES || ''}','${COMPANY_FACES || ''}','${SELLING_PRICE || ''}','${COMP_PROD_LIST || ''}','${EXPIRY_LIST || ''}','${VISIT_ID}','${availability}','${pricingAttachment}') 
         ON CONFLICT(ID,CATEGORY,VISIT_ID) DO UPDATE SET 
         TASK='${TASK_ID}',
         ALL_FACES='${ALL_FACES || ''}',
         COMPANY_FACES='${COMPANY_FACES || ''}',
         SELLING_PRICE='${SELLING_PRICE || ''}',
         COMP_PROD_LIST='${COMP_PROD_LIST || ''}',
         EXPIRY_LIST='${EXPIRY_LIST || ''}',
         ITEM_AVAILABLE='${availability}',
         PRICING_ATTACHMENT='${pricingAttachment}'`;
        await db.execAsync(itemQuery);

        // Save task time tracking if available
        if (TASK_TIME && TASK_TIME !== '' && !isNaN(TASK_TIME)) {
          const timeTrackingQuery = `INSERT INTO VISIT_TIME_TRACKING(VISIT_ID, CATEGORY_ID, TASK_ID, TIME_SPENT) 
           VALUES('${VISIT_ID}', '${catId}', '${TASK_ID}', ${TASK_TIME}) 
           ON CONFLICT(VISIT_ID, CATEGORY_ID, TASK_ID) 
           DO UPDATE SET TIME_SPENT = ${TASK_TIME}`;
          await db.execAsync(timeTrackingQuery);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error loading visit from JSON:', error);
    return { success: false, error: error.message };
  }
};

//export const isArabic = () => STRINGS.curLanguage.startsWith("ar");
