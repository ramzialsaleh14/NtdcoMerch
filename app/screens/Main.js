import React, { useState, useEffect } from "react";
import { Button, Modal, TextInput, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Platform,
  Image,
  Pressable,
  FlatList,
  I18nManager,
  Dimensions,
  ScrollView
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Constants2 from "../utils/Constants";
import * as Notifications from "expo-notifications";
import * as ServerOperations from "../utils/ServerOperations";
import * as Commons from "../utils/Commons";
import i18n from "../languages/langStrings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import moment from "moment";
import ProgressDialog from "react-native-progress-dialog";
import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import * as Application from "expo-application";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from 'expo-image-picker';
import * as actions from "../actions/main";
import Color, { White } from 'react-native-material-color';

TouchableOpacity.defaultProps = { activeOpacity: 0.8 };
const height = Dimensions.get('window').height;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function MainScreen({ navigation, route }) {
  const [curUser, setCurUser] = useState("");
  const [progressDialogVisible, setProggressDialogVisible] = useState(false);
  const [showSelectCustomerModal, setShowSelectCustomerModal] = useState(false);
  const [showSelectMerchUserModal, setShowSelectMerchUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [visitCustomer, setVisitCustomer] = useState("");
  const [visitCustomerName, setVisitCustomerName] = useState("");
  const [visitMerch, setVisitMerch] = useState("");
  const [visitMerchName, setVisitMerchName] = useState("");
  const [visitPass, setVisitPass] = useState("");
  const [fitleredCustomersList, setFilteredCustomersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [merchCustomersList, setMerchCustomersList] = useState([]);
  const [filteredMerchCustomersList, setFilteredMerchCustomersList] = useState([]);
  const [filteredMerchUsersList, setFilteredMerchUsersList] = useState([]);
  const [merchUsersList, setMerchUsersList] = useState([]);
  const [curLang, setCurLang] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [custModalType, setCustModalType] = useState("");
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [showEditMerchModal, setShowEditMerchModal] = useState(false);
  const [showSelectMerchForEditModal, setShowSelectMerchForEditModal] = useState(false);
  const [selectedMerchForEdit, setSelectedMerchForEdit] = useState("");
  const [selectedMerchForEditName, setSelectedMerchForEditName] = useState("");
  const [merchPassword, setMerchPassword] = useState("");
  const [merchDeviceId, setMerchDeviceId] = useState("");
  const [merchAssignedCustomers, setMerchAssignedCustomers] = useState([]);
  const [merchAssignedSearch, setMerchAssignedSearch] = useState("");
  const [showAddCustomerToMerchModal, setShowAddCustomerToMerchModal] = useState(false);
  const [filteredAvailableCustomers, setFilteredAvailableCustomers] = useState([]);


  useEffect(() => {
    setProggressDialogVisible(true);
    actions.registerUserToken(navigation);
    getCurUser();
    MediaLibrary.requestPermissionsAsync();
    ImagePicker.requestCameraPermissionsAsync();
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Commons.okAlert('Permission to access location was denied');
          setProggressDialogVisible(false);
          return;
        }

        const doUpdate = route.params.updateData;
        if (doUpdate == true) {
          await updateData();
        }

        // Load local data first
        const custlist = await Commons.getCustomersDB();
        setCustomersList(custlist);
        setFilteredCustomersList(custlist);
        const currentlang = await Commons.getFromAS("lang");
        setCurLang(currentlang);
        const teamLeader = await Commons.getFromAS("isTeamLeader");
        setIsTeamLeader(teamLeader === "true");

        // Check and sync visits after local DB operations complete
        const user = await Commons.getFromAS("userID");
        if (user) {
          try {
            setProggressDialogVisible(true);
            const syncResult = await Commons.checkAndSyncVisits(user);
            setProggressDialogVisible(false);
            if (syncResult.synced) {
              console.log(syncResult.message);
            }
          } catch (syncError) {
            console.log('Sync check failed:', syncError);
            // Continue without blocking the app
          }
        }
      } catch (error) {
        console.error('Error in Main screen initialization:', error);
      } finally {
        setProggressDialogVisible(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setProggressDialogVisible(true);
        const custlist = await Commons.getCustomersDB();
        setCustomersList(custlist);
        setFilteredCustomersList(custlist);
        const merchUsersStr = await Commons.getFromAS("merchUsers");
        if (merchUsersStr) {
          const merchList = JSON.parse(merchUsersStr);
          setMerchUsersList(merchList);
          setFilteredMerchUsersList(merchList);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setProggressDialogVisible(false);
      }
    })();
  }, [refresh]);

  const clearStorage = async () => {
    await Commons.removeFromAS("userID");
    await Commons.removeFromAS("password");
    const user = await Commons.getFromAS("userID");
    console.log(user);
    navigation.navigate("Login");
    // BackHandler.exitApp();
  };

  const getCurUser = async () => {
    const currentUser = await Commons.getFromAS("userID");
    console.log("user = " + currentUser)
    if (currentUser == null) {
      clearStorage();
      Commons.okAlert("User Not Logged in");
    }
    setCurUser(currentUser);
  };

  const renderCustItem = ({ item }) => {
    return (
      <View>
        <TouchableOpacity
          onPress={async () => {
            if (custModalType == "newVisit") {
              setShowSelectCustomerModal(false);
              await Commons.saveToAS("selectedCustomer", item.CODE);
              await Commons.removeFromAS("curVisit");
              let seq = 1
              const user = await Commons.getFromAS("userID");
              const curSeq = await Commons.getVisitSequence(user);
              console.log("Sequence: " + curSeq);
              //if (curSeq.length > 0) seq = curSeq[curSeq.length - 1].SEQ + 1
              navigation.navigate("NewVisit", { visitID: user + "-" + (curSeq + 1) });
            }
            if (custModalType == "visitPass") {
              setVisitCustomer(item.CODE);
              setVisitCustomerName(item.NAME);
              setShowSelectCustomerModal(false);
            }

          }}
        >
          <View
            style={{
              flexDirection: "row",
              padding: 15,
              borderWidth: 0.5,
              borderRadius: 5,
              marginBottom: 5

            }}
          >
            <Text style={{ marginRight: 20, color: "red" }}>
              {item.CODE}
            </Text>
            <Text
              style={{
                flex: 1,
                color: "#111",
                textAlign: I18nManager.isRTL ? "right" : "left",
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.NAME && item.NAME.trim() !== "" ? item.NAME : item.CODE}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    )

  }

  const renderMerchUserItem = ({ item }) => {
    return (
      <View>
        <TouchableOpacity
          onPress={async () => {
            setVisitMerch(item.ID);
            setVisitMerchName(item.NAME);
            setShowSelectMerchUserModal(false);

            // Load customers for this merchandiser
            if (custModalType === "visitPass") {
              setProggressDialogVisible(true);
              try {
                const merchCustomers = await ServerOperations.getCustomers(item.ID);
                if (merchCustomers && Array.isArray(merchCustomers)) {
                  setMerchCustomersList(merchCustomers);
                  setFilteredMerchCustomersList(merchCustomers);
                } else {
                  setMerchCustomersList([]);
                  setFilteredMerchCustomersList([]);
                }
              } catch (error) {
                console.error('Error loading merchandiser customers:', error);
                setMerchCustomersList([]);
                setFilteredMerchCustomersList([]);
              } finally {
                setProggressDialogVisible(false);
              }
            }
          }}
        >
          <View
            style={{
              flexDirection: "row",
              padding: 15,
              borderWidth: 0.5,
              borderRadius: 5,
              marginBottom: 5

            }}
          >
            <Text style={{ marginRight: 20, color: "red" }}>
              {item.ID}
            </Text>
            <Text
              style={{
                flex: 1,
                color: "#111",
                textAlign: I18nManager.isRTL ? "right" : "left",
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.NAME && item.NAME.trim() !== "" ? item.NAME : item.ID}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    )

  }

  const updateData = async () => {
    setProggressDialogVisible(true);
    try {
      // Fetch everything first so we only clear local DB if fetch succeeded
      const [cats, customers, visitPasses, merchUsers, tasks, items] = await Promise.all([
        ServerOperations.getCategories(),
        ServerOperations.getCustomers(),
        ServerOperations.getVisitPasswords(),
        ServerOperations.getMerchUsers(),
        ServerOperations.getTasks(curUser),
        ServerOperations.getCategoryItems(),
      ]);

      // Clear the local server-synced tables before writing fresh data
      await Commons.clearServerSyncedData();

      // Load fresh data into local DB
      await Commons.loadCustomers(customers);
      await Commons.loadCategories(cats);
      await Commons.loadVisitPasswords(visitPasses);
      await Commons.loadMerchUsers(merchUsers);
      await Commons.loadItems(items);
      await Commons.loadTasks(tasks);

      Commons.okAlert(i18n.t("dataUpdated"));
      setRefresh(!refresh);
    } catch (err) {
      console.error('updateData failed', err);
      Commons.okAlert(i18n.t("error"), i18n.t("dataUpdateFailed") || 'Update failed');
    } finally {
      setProggressDialogVisible(false);
    }
  }

  const renderSelectCustomerModal = () => {
    const isVisitPassMode = custModalType === "visitPass";
    const displayList = isVisitPassMode ? filteredMerchCustomersList : fitleredCustomersList;
    const sourceList = isVisitPassMode ? merchCustomersList : customersList;

    return (
      <Modal
        visible={true}
        onDismiss={() => {
          setShowSelectCustomerModal(false);
        }}
        contentContainerStyle={styles.modalStyle}
      >
        <TextInput
          placeholder={i18n.t("search")}
          clearButtonMode="always"
          style={styles.searchBox}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            const list = Commons.handleSearch(text, sourceList);
            if (isVisitPassMode) {
              setFilteredMerchCustomersList(list);
            } else {
              setFilteredCustomersList(list);
            }
          }}
        />
        <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants2.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
          {i18n.t("customers")}
        </Text>
        <FlatList
          keyExtractor={(item) => item.CODE}
          data={displayList}
          extraData={displayList}
          renderItem={renderCustItem}
        />
        <Button mode="contained" style={{ borderRadius: 0 }} onPress={async () => {
          setShowSelectCustomerModal(false);
        }}>
          <Text style={styles.text}>{i18n.t("back")}</Text>
        </Button>
      </Modal>
    )
  }

  const renderSelectMerchForEditModal = () => {
    return (
      <Modal
        visible={true}
        onDismiss={() => {
          setShowSelectMerchForEditModal(false);
        }}
        contentContainerStyle={styles.modalStyle}
      >
        <TextInput
          placeholder={i18n.t("search")}
          clearButtonMode="always"
          style={styles.searchBox}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            const list = Commons.handleSearch(text, merchUsersList);
            setFilteredMerchUsersList(list);
          }}
        />
        <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants2.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
          {i18n.t("users")}
        </Text>
        <FlatList
          keyExtractor={(item) => item.ID}
          data={filteredMerchUsersList}
          extraData={filteredMerchUsersList}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                onPress={async () => {
                  setSelectedMerchForEdit(item.ID);
                  setSelectedMerchForEditName(item.NAME);
                  setShowSelectMerchForEditModal(false);
                  setProggressDialogVisible(true);
                  try {
                    const merchInfo = await ServerOperations.getMerchInfo(item.ID);
                    if (merchInfo && merchInfo.PASSWORD !== undefined && merchInfo.DEVICE_ID !== undefined) {
                      setMerchPassword(merchInfo.PASSWORD || "");
                      setMerchDeviceId(merchInfo.DEVICE_ID || "");
                      setMerchAssignedCustomers(merchInfo.CUSTOMERS || []);
                      setShowEditMerchModal(true);
                    } else {
                      Commons.okAlert(i18n.t("error"));
                    }
                  } catch (error) {
                    console.error('Error loading merch info:', error);
                    Commons.okAlert(i18n.t("error"));
                  } finally {
                    setProggressDialogVisible(false);
                  }
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    padding: 15,
                    borderWidth: 0.5,
                    borderRadius: 5,
                    marginBottom: 5
                  }}
                >
                  <Text style={{ marginRight: 20, color: "red" }}>
                    {item.ID}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: "#111",
                      textAlign: I18nManager.isRTL ? "right" : "left",
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.NAME}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        />
        <Button mode="contained" style={{ borderRadius: 0 }} onPress={async () => {
          setShowSelectMerchForEditModal(false);
        }}>
          <Text style={styles.text}>{i18n.t("back")}</Text>
        </Button>
      </Modal>
    )
  }

  const renderSelectMerchUserModal = () => {
    return (
      <Modal
        visible={true}
        onDismiss={() => {
          setShowSelectMerchUserModal(false);
        }}
        contentContainerStyle={styles.modalStyle}
      >
        <TextInput
          placeholder={i18n.t("search")}
          clearButtonMode="always"
          style={styles.searchBox}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            const list = Commons.handleSearch(text, merchUsersList);
            setFilteredMerchUsersList(list);
          }}
        />
        <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants2.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
          {i18n.t("users")}
        </Text>
        <FlatList
          keyExtractor={(item) => item.ID}
          data={filteredMerchUsersList}
          extraData={filteredMerchUsersList}
          renderItem={renderMerchUserItem}
        />
        <Button mode="contained" style={{ borderRadius: 0 }} onPress={async () => {
          setShowSelectMerchUserModal(false);
        }}>
          <Text style={styles.text}>{i18n.t("back")}</Text>
        </Button>
      </Modal>
    )
  }
  const renderAddCustomerToMerchModal = () => {
    return (
      <Modal
        visible={true}
        onDismiss={() => {
          setShowAddCustomerToMerchModal(false);
        }}
        contentContainerStyle={styles.modalStyle}
      >
        <TextInput
          placeholder={i18n.t("search")}
          clearButtonMode="always"
          style={styles.searchBox}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            const list = Commons.handleSearch(text, customersList);
            setFilteredAvailableCustomers(list);
          }}
        />
        <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants2.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
          {i18n.t("customers")}
        </Text>
        <FlatList
          keyExtractor={(item) => item.CODE}
          data={filteredAvailableCustomers}
          extraData={filteredAvailableCustomers}
          renderItem={({ item }) => {
            const isAlreadyAdded = merchAssignedCustomers.some(c => c.CODE === item.CODE);
            return (
              <View>
                <TouchableOpacity
                  onPress={() => {
                    if (!isAlreadyAdded) {
                      setMerchAssignedCustomers(prev => [...prev, { CODE: item.CODE, NAME: item.NAME }]);
                      setShowAddCustomerToMerchModal(false);
                    }
                  }}
                  disabled={isAlreadyAdded}
                  style={{ opacity: isAlreadyAdded ? 0.5 : 1 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      padding: 15,
                      borderWidth: 0.5,
                      borderRadius: 5,
                      marginBottom: 5,
                      backgroundColor: isAlreadyAdded ? "#f0f0f0" : "white"
                    }}
                  >
                    <Text style={{ marginRight: 20, color: "red" }}>
                      {item.CODE}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        color: "#111",
                        textAlign: I18nManager.isRTL ? "right" : "left",
                      }}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.NAME && item.NAME.trim() !== "" ? item.NAME : item.CODE}
                    </Text>
                    {isAlreadyAdded && (
                      <Ionicons name="checkmark-circle" size={20} color="green" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
        <Button mode="contained" style={{ borderRadius: 0 }} onPress={async () => {
          setShowAddCustomerToMerchModal(false);
        }}>
          <Text style={styles.text}>{i18n.t("back")}</Text>
        </Button>
      </Modal>
    )
  }

  const renderEditMerchModal = () => {
    const filteredAssignedCustomers = merchAssignedCustomers.filter((cust) => {
      if (!merchAssignedSearch) return true;
      const term = merchAssignedSearch.toLowerCase();
      return (
        cust.CODE.toLowerCase().includes(term) ||
        (cust.NAME && cust.NAME.toLowerCase().includes(term))
      );
    });
    return (
      <Modal
        visible={true}
        onDismiss={() => {
          setShowEditMerchModal(false);
          setSelectedMerchForEdit("");
          setSelectedMerchForEditName("");
          setMerchPassword("");
          setMerchDeviceId("");
          setMerchAssignedCustomers([]);
          setMerchAssignedSearch("");
        }}
        contentContainerStyle={{ backgroundColor: "white", height: "90%", flexDirection: "column" }}
      >
        <View>
          <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants2.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%", marginBottom: 20 }}>
            {i18n.t("editMerchInfo")}
          </Text>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 14, color: "#111", marginBottom: 5 }}>
            {i18n.t("user")}: {selectedMerchForEditName} ({selectedMerchForEdit})
          </Text>
          <TextInput
            label={i18n.t("password")}
            clearButtonMode="always"
            style={styles.searchBox}
            value={merchPassword}
            onChangeText={setMerchPassword}
            returnKeyType="done"
            blurOnSubmit={true}
          />
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 5 }}>
              {i18n.t("deviceId")}:
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.searchBox, { flex: 1, marginRight: 10, marginBottom: 0, padding: 15, justifyContent: "center", backgroundColor: "#f5f5f5" }]}>
                <Text style={{ color: merchDeviceId ? "#111" : "#999", fontSize: 14 }}>
                  {merchDeviceId || i18n.t("notAvailable")}
                </Text>
              </View>
              <Button
                mode="contained"
                style={{ backgroundColor: "red" }}
                onPress={() => {
                  Commons.confirmAlert(
                    i18n.t("confirm"),
                    i18n.t("clearDeviceIdConfirm"),
                    () => setMerchDeviceId("")
                  );
                }}
              >
                <Text style={styles.text}>{i18n.t("clear")}</Text>
              </Button>
            </View>
          </View>
          <View style={{ marginBottom: 10, flex: 1 }}>
            <TextInput
              placeholder={i18n.t("searchCustomer")}
              clearButtonMode="always"
              style={[styles.searchBox, { marginBottom: 5 }]}
              value={merchAssignedSearch}
              onChangeText={(text) => setMerchAssignedSearch(text)}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <Text style={{ fontSize: 14, color: "#666" }}>
                {i18n.t("customers")} ({merchAssignedCustomers.length}):
              </Text>
              <Button
                mode="contained"
                compact
                style={{ backgroundColor: Constants2.appColor }}
                onPress={() => {
                  setFilteredAvailableCustomers(customersList);
                  setShowAddCustomerToMerchModal(true);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: "white", fontSize: 12 }}>{i18n.t("addCustomer")}</Text>
                </View>
              </Button>
            </View>
            <ScrollView style={{ maxHeight: 400, borderWidth: 1, borderColor: "#ddd", borderRadius: 5, padding: 5 }}>
              {filteredAssignedCustomers.length === 0 ? (
                <Text style={{ color: "#999", textAlign: "center", padding: 10 }}>
                  {i18n.t("noCustomersAssigned") || "No customers assigned"}
                </Text>
              ) : (
                filteredAssignedCustomers.map((cust, index) => (
                  <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 8, borderBottomWidth: 0.5, borderBottomColor: "#eee" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "red", fontSize: 12 }}>{cust.CODE}</Text>
                      <Text style={{ color: "#111", fontSize: 14 }}>{cust.NAME}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Commons.confirmAlert(
                          i18n.t("confirm"),
                          i18n.t("areYouSure"),
                          () => {
                            setMerchAssignedCustomers(prev => prev.filter((item) => item.CODE !== cust.CODE));
                          }
                        );
                      }}
                    >
                      <Ionicons name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </ScrollView>
        <View style={{ flexDirection: "row", padding: 20, paddingTop: 10 }}>
          <Button mode="contained" style={{ borderRadius: 0, flex: 0.5, marginRight: 5 }} onPress={async () => {
            setShowEditMerchModal(false);
            setSelectedMerchForEdit("");
            setSelectedMerchForEditName("");
            setMerchPassword("");
            setMerchDeviceId("");
            setMerchAssignedCustomers([]);
            setMerchAssignedSearch("");
          }}>
            <Text style={styles.text}>{i18n.t("back")}</Text>
          </Button>
          <Button mode="contained" style={{ borderRadius: 0, flex: 0.5 }} onPress={async () => {
            if (merchPassword.trim() === "") {
              Commons.okAlert(i18n.t("emptyFields"));
              return;
            }
            setProggressDialogVisible(true);
            try {
              const customerCodes = merchAssignedCustomers.map(c => c.CODE).join("@@");
              const resp = await ServerOperations.editMerchInfo(selectedMerchForEdit, merchPassword, merchDeviceId, customerCodes);
              if (resp.res === true || resp.res === "true") {
                Commons.okAlert(i18n.t("saved"));
                setShowEditMerchModal(false);
                setSelectedMerchForEdit("");
                setSelectedMerchForEditName("");
                setMerchPassword("");
                setMerchDeviceId("");
                setMerchAssignedCustomers([]);
                setMerchAssignedSearch("");
              } else {
                Commons.okAlert(i18n.t("notSent"));
              }
            } catch (error) {
              console.error('Error saving merch info:', error);
              Commons.okAlert(i18n.t("error"));
            } finally {
              setProggressDialogVisible(false);
            }
          }}>
            <Text style={styles.text}>{i18n.t("saveChanges")}</Text>
          </Button>
        </View>
      </Modal>
    )
  }

  const renderPasswordModal = () => {
    return (
      <Modal
        visible={true}
        onDismiss={() => {
          setShowPasswordModal(false);
          setVisitCustomer("");
          setVisitCustomerName("");
          setVisitMerch("");
          setVisitMerchName("");
          setVisitPass("");
          setMerchCustomersList([]);
          setFilteredMerchCustomersList([]);
        }}
        contentContainerStyle={{ backgroundColor: "white", padding: 20 }}
      >
        <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants2.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
          {i18n.t("visitPass")}
        </Text>
        <TouchableOpacity onPress={() => {
          setCustModalType("visitPass");
          setShowSelectMerchUserModal(true);
        }}>
          <TextInput
            placeholder={i18n.t("user")}
            clearButtonMode="always"
            style={styles.searchBox}
            value={visitMerchName}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (visitMerch === "") {
              Commons.okAlert(i18n.t("pleaseSelectMerchFirst") || "Please select a merchandiser first");
              return;
            }
            setCustModalType("visitPass");
            setShowSelectCustomerModal(true);
          }}
          disabled={visitMerch === ""}
        >
          <TextInput
            placeholder={i18n.t("customer")}
            clearButtonMode="always"
            style={[styles.searchBox, visitMerch === "" && { opacity: 0.5 }]}
            value={visitCustomerName}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setCustModalType("visitPass");
          setShowSelectMerchUserModal(true);
        }} style={{ display: "none" }}>
          <TextInput
            placeholder={i18n.t("user")}
            clearButtonMode="always"
            style={styles.searchBox}
            value={visitMerchName}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        <TextInput
          placeholder={i18n.t("password")}
          clearButtonMode="always"
          style={styles.searchBox}
          value={visitPass}
          onChangeText={setVisitPass}
          returnKeyType="done"
          blurOnSubmit={true}
        />
        <View style={{ flexDirection: "row" }}>
          <Button mode="contained" style={{ borderRadius: 0, flex: 0.5, marginRight: 5 }} onPress={async () => {
            setShowPasswordModal(false);
            setVisitCustomer("");
            setVisitCustomerName("");
            setVisitMerch("");
            setVisitMerchName("");
            setVisitPass("");
            setMerchCustomersList([]);
            setFilteredMerchCustomersList([]);
          }}>
            <Text style={styles.text}>{i18n.t("back")}</Text>
          </Button>
          <Button mode="contained" style={{ borderRadius: 0, flex: 0.5 }} onPress={async () => {
            if (visitCustomer == "" || visitMerch == "" || visitPass.trim() == "") {
              Commons.okAlert(i18n.t("emptyFields"))
              return;
            }
            const resp = await ServerOperations.saveVisitPassword(visitCustomer, visitMerch, visitPass);
            if (resp.res == true) {
              Commons.okAlert(i18n.t("sent"))
              setShowPasswordModal(false);
              setVisitCustomer("");
              setVisitCustomerName("");
              setVisitMerch("");
              setVisitMerchName("");
              setVisitPass("");
              setMerchCustomersList([]);
              setFilteredMerchCustomersList([]);
            } else {
              if (resp.res == "exists") {
                Commons.okAlert(i18n.t("exists"));
              } else {
                Commons.okAlert(i18n.t("notSent"));
              }
            }
          }}>
            <Text style={styles.text}>{i18n.t("confirm")}</Text>
          </Button>
        </View>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={styles.view} >
      <Portal>{!!showPasswordModal && renderPasswordModal()}</Portal>
      <Portal>{!!showEditMerchModal && renderEditMerchModal()}</Portal>
      <Portal>{!!showAddCustomerToMerchModal && renderAddCustomerToMerchModal()}</Portal>
      <Portal>{!!showSelectMerchForEditModal && renderSelectMerchForEditModal()}</Portal>
      <Portal>{!!showSelectMerchUserModal && renderSelectMerchUserModal()}</Portal>
      <Portal>{!!showSelectCustomerModal && renderSelectCustomerModal()}</Portal>
      <ProgressDialog visible={progressDialogVisible} label={i18n.t("loading")} />
      {/* <Image style={styles.image} source={require("../../assets/logo.png")} /> */}
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => {
            setCustModalType("newVisit");
            setShowSelectCustomerModal(true);
          }}
          style={styles.appButtonContainer(curLang)}
        >
          <Ionicons name="add-circle" style={{ marginHorizontal: 12 }} size={26} color={Constants2.appColor} />
          <Text style={styles.appButtonText}>
            {i18n.t("newVisit")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appButtonContainer(curLang)}
          onPress={async () => {
            await Commons.removeFromAS("curVisit");
            navigation.navigate("MyVisits");
          }}
        >
          <Ionicons name="list" style={{ marginHorizontal: 12 }} size={26} color={Constants2.appColor} />
          <Text style={styles.appButtonText}>
            {i18n.t("myVisits")}
          </Text>
        </TouchableOpacity>
        {isTeamLeader && (
          <TouchableOpacity
            onPress={async () => {
              setShowPasswordModal(true)
            }}
            style={styles.appButtonContainer(curLang)}
          >
            <Ionicons name="key" style={{ marginHorizontal: 12 }} size={26} color={Constants2.appColor} />
            <Text style={styles.appButtonText}>
              {i18n.t("visitPass")}
            </Text>
          </TouchableOpacity>
        )}
        {isTeamLeader && (
          <TouchableOpacity
            onPress={async () => {
              setShowSelectMerchForEditModal(true)
            }}
            style={styles.appButtonContainer(curLang)}
          >
            <Ionicons name="person-circle" style={{ marginHorizontal: 12 }} size={26} color={Constants2.appColor} />
            <Text style={styles.appButtonText}>
              {i18n.t("editMerchInfo")}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={async () => {
            await updateData()
          }}
          style={styles.appButtonContainer(curLang)}
        >
          <Ionicons name="sync" style={{ marginHorizontal: 12 }} size={26} color={Constants2.appColor} />
          <Text style={styles.appButtonText}>
            {i18n.t("update")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={{ backgroundColor: Constants2.appColor, width: "100%", height: height / 10, flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity
          onPress={clearStorage}
          style={{
            flexDirection: curLang == "ar" ? "row-reverse" : "row",
            padding: 10,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: Color.WHITE,
            alignItems: "center"
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "white", marginHorizontal: 5 }}>
            {i18n.t("logout")}
          </Text>
          <Ionicons color="white" size={24} name="log-out" />
        </TouchableOpacity>
        <Text style={{ color: "white", alignSelf: "center" }}>
          {Constants2.appVersion}
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await actions.switchLanguage(i18n.t("changeLang"));
            const newLang = await Commons.getFromAS("lang");
            setCurLang(newLang);
            setRefresh(!refresh);
          }}
          style={{
            flexDirection: curLang == "ar" ? "row-reverse" : "row",
            padding: 10,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: Color.WHITE,
            alignItems: "center"
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "white", marginHorizontal: 5 }}>
            {i18n.t("changeLang")}
          </Text>
          <Ionicons color="white" size={24} name="language" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  datetimepickerstyle: {
    alignSelf: "center",
    width: 100,
    padding: 15,
  },
  text: { color: "white", fontWeight: "bold", fontSize: 16 },
  mainPicker: {
    height: Platform.OS === "ios" ? 150 : 50,
    marginTop: Platform.OS === "ios" ? -75 : 0,
    width: 160,
    marginRight: Platform.OS === "ios" ? "70%" : "30%",
  },
  locPicker: {
    height: Platform.OS === "ios" ? 150 : 50,
    marginTop: Platform.OS === "ios" ? -95 : -15,
    margin: 25,
    flex: 2,
    width: 300,
    marginRight: "10%",
  },
  typePicker: {
    height: Platform.OS === "ios" ? 150 : 50,
    marginTop: Platform.OS === "ios" ? -50 : -15,
    marginBottom: Platform.OS === "ios" ? 40 : 25,
    margin: 25,
    flex: 2,
    width: 300,
    marginRight: "10%",
  },
  typePicker2: {
    height: Platform.OS === "ios" ? 150 : 50,
    marginTop: Platform.OS === "ios" ? -55 : -15,
    marginBottom: Platform.OS === "ios" ? 40 : 25,
    alignSelf: "center",
    margin: 25,
    width: 300,
    marginRight: "10%",
  },
  searchBox: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: "center",
    color: "#111111"
  },
  dateTimeTexts: {
    fontSize: 18,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "#111111"
  },
  dateTimeButtons: {
    borderColor: "rgb(1,135,134)",
  },
  modalStyle: {
    backgroundColor: "white",
    padding: 20,
    height: "95%",
  },
  view: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  appButtonContainer: curLang => ({
    width: '80%',
    margin: 2,
    marginBottom: 12,
    backgroundColor: Color.GREY[50],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Color.GREY[500],
    borderRadius: 4,
    padding: 15,
    alignItems: 'center',
    alignContent: 'center',
    backgroundColor: White,
    flexDirection: curLang == "ar" ? "row-reverse" : "row",
    alignSelf: 'center',
  }),
  container: {
    backgroundColor: Color.GREY[100],
    alignItems: 'center',
    paddingTop: 80,
    minHeight: height - height / 10
  },
  appButtonText: {
    fontSize: 18,
    marginHorizontal: 4,
    color: "#111111"
  },
  appButton: {
    margin: 20,
  },
  image: {
    width: 150,
    height: 155,
    marginBottom: 20,
    alignSelf: "center",
    marginTop: -75,
  },
  image2: {
    width: 350,
    height: 285,
    alignSelf: "center",
  },
});

//export default MainScreen;
