import { Platform } from "react-native";
// colors
export const appColor = "#AB9F87";
export const darkBlueColor = "#386280";
export const greenColor = "#6BA561";
// Urls
export const appVersion = "v1.0.9";
export const serverBaseUrl = "http://ntdco.ddns.net";
//export const serverBaseUrl = "http://192.168.1.231:8080";
export const serverPublicBaseUrl = "http://ntdco.ddns.net";
//export const serverPublicBaseUrl = "http://192.168.1.231:8080";
export const pickServerUrl =
  serverBaseUrl +
  "/pick/faces/redirect?item_id=MERCH.WEBSERVICE&input_id=1&service=y&appversion=" +
  appVersion +
  "&";
export const pickPublicServerUrl =
  serverPublicBaseUrl +
  "/pick/faces/redirect?item_id=MERCH.WEBSERVICE&input_id=1&service=y&appversion=" +
  appVersion +
  "&";

export const serverAttachmentsBaseUrl =
  serverPublicBaseUrl + "/pick/faces/attachments/MerchApp/";
export const CURRENT_SERVER = "CURRENT_SERVER";
export const CURRENT_SERVER_IP = "CURRENT_SERVER_IP";
// User
export const cur_user = "cur.user";

// Codes
export const networkError_code = 100;

// Actions
export const CHECK_LOGIN = "CHECK.LOGIN";
export const UPLOAD = "UPLOAD";
export const SEND_USER_TOKEN = "SEND.USER.TOKEN";
export const GET_SERVER_TOKEN = "GET.SERVER.TOKEN";
export const GET_BATCHES = "GET.BATCHES";
export const GET_CATEGORIES = "GET.CATEGORIES";
export const GET_CUSTOMERS = "GET.CUSTOMERS";
export const GET_VISIT_PASSWORDS = "GET.VISIT.PASSWORDS";
export const GET_TASKS = "GET.TASKS";
export const GET_CAT_ITEMS = "GET.CAT.ITEMS";
export const UPDATE_CUSTOMER_LOCATION = "UPDATE.CUSTOMER.LOCATION";
export const GET_CUSTOMER_LOCATION = "GET.CUSTOMER.LOCATION";
export const GET_MERCH_USERS = "GET.MERCH.USERS";
export const SAVE_VISIT_PASSWORD = "SAVE.VISIT.PASSWORD";
export const POST_VISIT = "POST.VISIT";
export const GET_USER_VISITS_JSON = "GET.USER.VISITS.JSON";
export const GET_USER_LAST_VISIT_SEQ = "GET.USER.LAST.VISIT.SEQ";
export const GET_MERCH_INFO = "GET.MERCH.INFO";
export const EDIT_MERCH_INFO = "EDIT.MERCH.INFO";

