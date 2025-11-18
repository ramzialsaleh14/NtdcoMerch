import { Platform } from "react-native";
import * as Constants from "./Constants";
import * as Commons from "./Commons";

const httpTimeout = (ms, promise) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("timeout"));
    }, ms);
    promise.then(resolve, reject);
  });

export const httpRequest = async (url) => {
  /* Send request */
  const TIMEOUT = 20000;

  const response = await httpTimeout(
    TIMEOUT,
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).catch((error) => {
      console.error(error);
      return Constants.networkError_code;
    })
  ).catch((error) => {
    return Constants.networkError_code;
  });
  const json = await response.json();
  return json;
};

export const ping = async (url, timeout) => {
  const response = await httpTimeout(
    timeout,
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "action=",
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error("HTTP response status not code 200 as expected.");
        }
      })
      .catch((error) => {
        console.error(error);
        return Constants.networkError_code;
      })
  ).catch((error) => {
    console.log(error);
    return Constants.networkError_code;
  });
  return response;
};

export const pickHttpRequest = async (params) => {
  /* Send request */
  params = params
    .replace(/١/g, 1)
    .replace(/٢/g, 2)
    .replace(/٣/g, 3)
    .replace(/٤/g, 4)
    .replace(/٥/g, 5)
    .replace(/٦/g, 6)
    .replace(/٧/g, 7)
    .replace(/٨/g, 8)
    .replace(/٩/g, 9)
    .replace(/٠/g, 0);
  const TIMEOUT = 20000;
  const user = await Commons.getFromAS("userID");
  const url = Constants.pickServerUrl + params + "&currentuser=" + user;

  console.log(url);

  const response = await httpTimeout(
    TIMEOUT,
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }).catch((error) => {
      console.error(error);
      return Constants.networkError_code;
    })
  ).catch((error) => {
    return Constants.networkError_code;
  });

  return response;
};

export const checkLogin = async (userID, password) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.CHECK_LOGIN}`;
  params += `&USER=${userID}`;
  params += `&PASSWORD=${password}`;
  params += `&APP.VERSION=${Constants.appVersion}`;

  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getServerToken = async (user) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_SERVER_TOKEN}`;
  params += `&USER=${user}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getCategoryItems = async () => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_CAT_ITEMS}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getCustomers = async () => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_CUSTOMERS}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};
export const getVisitPasswords = async () => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_VISIT_PASSWORDS}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getTasks = async (user) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_TASKS}`;
  params += `&USER=${user}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getCategories = async () => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_CATEGORIES}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const pickUploadHttpRequest = async (file, retryNum) => {
  /* Send request */
  const TIMEOUT = 45000;
  const currServer = Constants.serverPublicBaseUrl;
  const url =
    "https://puresoft.ddns.net/pick/faces/redirect/NTDCOSERVICE?connector=ING.CONNECTOR";
  console.log(url);
  const body = new FormData();
  body.append("file", file);
  body.append("fname", file.name);
  body.append("FOLDER", "MerchApp");
  body.append("fileupload", "y");
  body.append("action", "upload");
  const response = await httpTimeout(
    TIMEOUT,
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data;",
      },
      body,
    }).catch((error) => {
      console.error(error);
      return Constants.networkError_code;
    })
  ).catch((error) => {
    console.log(error);
    return Constants.networkError_code;
  });
  console.log(JSON.stringify(response));
  if (response.ok !== true && retryNum < 4) {
    pickUploadHttpRequest(file, retryNum + 1);
  } else {
    if (response.ok !== true)
      Commons.okAlert("لم يتم الارسال", "الرجاء المحاولة مرة اخرى");
  }
  return response;
};


export const sendUserToken = async (user, token, devId) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.SEND_USER_TOKEN}`;
  params += `&USER=${user}`;
  params += `&TOKEN=${token}`;
  params += `&DEVID=${devId}`;

  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const updateCustomerLocation = async (code, location) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.UPDATE_CUSTOMER_LOCATION}`;
  params += `&CODE=${code}`;
  params += `&LOCATION=${location}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getCustomerLocation = async (code) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_CUSTOMER_LOCATION}`;
  params += `&CODE=${code}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getMerchUsers = async () => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_MERCH_USERS}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};
export const saveVisitPassword = async (cust, merch, pass) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.SAVE_VISIT_PASSWORD}`;
  params += `&CUSTOMER=${cust}`;
  params += `&MERCH.USER=${merch}`;
  params += `&PASS=${pass}`;
  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const postVisit = async (visitID, customer, inTime, outTime, notes, isPosted, user, tasksJson) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.POST_VISIT}`;
  params += `&VISIT.ID=${visitID}`;
  params += `&CUSTOMER=${customer}`;
  params += `&IN.TIME=${inTime}`;
  params += `&OUT.TIME=${outTime}`;
  params += `&NOTES=${encodeURIComponent(notes)}`;
  params += `&IS.POSTED=${isPosted}`;
  params += `&USER=${user}`;
  params += `&TASKS=${encodeURIComponent(tasksJson)}`;

  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return { success: false, error: "Network error" };
  }
  if (response.ok) {
    return await response.json();
  }

  return { success: false, error: "Unknown error" };
};

export const getUserVisitsJson = async (user) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_USER_VISITS_JSON}`;
  params += `&USER=${user}`;

  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    return await response.json();
  }

  return null;
};

export const getUserLastVisitSeq = async (user) => {
  /* Request params */
  let params = "";
  params += `action=${Constants.GET_USER_LAST_VISIT_SEQ}`;
  params += `&USER=${user}`;

  /* Send request */
  const response = await pickHttpRequest(params);

  /* Check response */
  if (response === Constants.networkError_code) {
    return null;
  }
  if (response.ok) {
    const data = await response.json();
    return data;
  }

  return null;
};
