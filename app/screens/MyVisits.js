import React, { useState, useEffect } from "react";
import { Button, Card, Modal, Portal, TextInput } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";
import * as ServerOperations from "../utils/ServerOperations";
import * as Commons from "../utils/Commons";
import * as SecureStore from "expo-secure-store";
import * as Constants from "../utils/Constants";
import * as Localization from "expo-localization";
import Color, { White } from 'react-native-material-color';
import {
    SafeAreaView,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Text,
    FlatList,
    Platform
} from "react-native";
import i18n from "../languages/langStrings";
import { loginTheme } from "../../App.style";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";

TouchableOpacity.defaultProps = { activeOpacity: 0.8 };
// interface Props {
//   navigation: any
// }

const AppButton = ({ onPress, title }) => (
    <TouchableOpacity onPress={onPress} style={styles.appButtonContainer}>
        <Text style={styles.appButtonText}>{title}</Text>
    </TouchableOpacity>
);

export const MyVisitsScreen = ({ navigation }) => {
    const [visitsList, setVisitsList] = useState([]);
    const [filteredVisitsList, setFilteredVisitsList] = useState([]);
    const [curLang, setCurLang] = useState("");
    const [curUser, setCurUser] = useState("");
    const [searchText, setSearchText] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const isFocused = useIsFocused();

    useEffect(() => {
        (async () => {
            if (isFocused) {
                const curLang = await Commons.getFromAS("lang");
                setCurLang(curLang);
                const user = await Commons.getFromAS("userID");
                setCurUser(user);
                await loadVisits(user, fromDate, toDate);
            }
        })();
    }, [isFocused]);

    const loadVisits = async (user, from, to) => {
        const visits = await Commons.getMyVisitsDB(user);
        if (visits != "" && visits != null && visits.length > 0) {
            setVisitsList(visits);
            filterVisitsByDate(visits, from, to);
        } else {
            setVisitsList([]);
            setFilteredVisitsList([]);
        }
    };

    const filterVisitsByDate = (visits, from, to) => {
        // Format dates to match DB format (DD/MM/YYYY)
        const fromDateStr = moment(from).format("DD/MM/YYYY");
        const toDateStr = moment(to).format("DD/MM/YYYY");

        const filtered = visits.filter(visit => {
            if (!visit.IN_TIME) return true; // Include visits without date

            // Extract date part from IN_TIME (format: "DD/MM/YYYY, h:mm")
            const visitDateStr = visit.IN_TIME.split(',')[0].trim();

            // Parse dates for comparison
            const visitDate = moment(visitDateStr, "DD/MM/YYYY");
            const fromMoment = moment(from).startOf('day');
            const toMoment = moment(to).endOf('day');

            return visitDate.isSameOrAfter(fromMoment) && visitDate.isSameOrBefore(toMoment);
        });

        setFilteredVisitsList(filtered);
    };

    const onFromDateChange = (event, selectedDate) => {
        setShowFromDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setFromDate(selectedDate);
            filterVisitsByDate(visitsList, selectedDate, toDate);
        }
    };

    const onToDateChange = (event, selectedDate) => {
        setShowToDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setToDate(selectedDate);
            filterVisitsByDate(visitsList, fromDate, selectedDate);
        }
    };

    const syncVisitsFromServer = async () => {
        setSyncing(true);
        try {
            const response = await ServerOperations.getUserVisitsJson(curUser);
            console.log('Server response:', response);

            // Check if response is an array directly
            if (response && Array.isArray(response) && response.length > 0) {
                let successCount = 0;
                let errorCount = 0;

                for (const visit of response) {
                    const result = await Commons.loadVisitFromJson(visit);
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                }

                // Reload visits from database
                await loadVisits(curUser, fromDate, toDate);

                Commons.toast(
                    `${i18n.t("syncComplete")}: ${successCount} ${i18n.t("success")}, ${errorCount} ${i18n.t("failed")}`,
                    true
                );
            } else {
                Commons.toast(i18n.t("noVisitsFound"), true);
            }
        } catch (error) {
            console.error('Sync error:', error);
            Commons.toast(i18n.t("syncError"), true);
        } finally {
            setSyncing(false);
        }
    };

    const deleteVisit = (idToDelete) => {
        Commons.deleteFromVisitSummary(idToDelete);
        setFilteredVisitsList((prevArray) => prevArray.filter((item) => item.ID !== idToDelete));
        setVisitsList((prevArray) => prevArray.filter((item) => item.ID !== idToDelete));
    }

    const renderVisitsItem = ({ item }) => {
        return (
            <TouchableOpacity style={{}} onPress={async () => {
                // if (item.STATUS == "Saved") {
                await Commons.saveToAS("selectedCustomer", item.CUSTOMER);
                navigation.navigate("NewVisit", { visitID: item.ID });
                // }
            }
            }>
                <View
                    style={{
                        padding: 15,
                        marginBottom: 10,
                        backgroundColor: Color.GREY[50],
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: Color.GREY[500],
                    }}
                >
                    <View style={{ paddingTop: 25 }}>
                        <Ionicons name="open-outline" size={18} color="white" style={{ backgroundColor: Constants.appColor, borderRadius: 0, padding: 8, position: "absolute", bottom: 5 }} />
                        {item.STATUS && item.STATUS.toLowerCase().trim() === "pending" && (
                            <TouchableOpacity style={{ position: "absolute", bottom: 5, right: 0 }} onPress={() => {
                                Commons.confirmAlert(i18n.t("areYouSure"), "", () => {
                                    deleteVisit(item.ID);
                                })
                            }}>
                                <Ionicons name="trash" size={18} color="white" style={{ backgroundColor: "red", borderRadius: 0, padding: 8 }} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={{ marginRight: 20, color: "red", alignSelf: "center", marginBottom: 15 }}>
                        {item.ID}
                    </Text>
                    <View style={styles.taskItemView(curLang)}>
                        <Text>{" "}{i18n.t("user")}{" "}</Text>
                        <Text>{item.USER}</Text>
                    </View>
                    <View style={styles.taskItemView(curLang)}>
                        <Text>{" "}{i18n.t("customer")}{" "}</Text>
                        <Text>{item.CUSTOMER}</Text>
                    </View>
                    <View style={[styles.taskItemView(curLang), { marginBottom: 15 }]}>
                        <Text>{"  "}</Text>
                        <Text>{item.NAME}</Text>
                    </View>
                    <View style={styles.taskItemView(curLang)}>
                        <Text>{" "}{i18n.t("inTime")}{" "}</Text>
                        <Text>{item.IN_TIME}</Text>
                    </View>
                    <View style={styles.taskItemView(curLang)}>
                        <Text>{" "}{i18n.t("outTime")}{" "}</Text>
                        <Text>{item.OUT_TIME}</Text>
                    </View>
                    <View style={styles.taskItemView(curLang)}>
                        <Text>{" "}{i18n.t("notes")}{" "}</Text>
                        <Text>{item.NOTES}</Text>
                    </View>
                    <View style={styles.taskItemView(curLang)}>
                        <Text>{" "}{i18n.t("status")}{" "}</Text>
                        <Text>{item.STATUS}</Text>
                    </View>
                </View>
            </TouchableOpacity >
        )
    }

    const renderDeleteDialog = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowDeleteDialog(false);
                }}
                contentContainerStyle={styles.modalStyle}
            >
                <Text style={styles.text, { color: Constants.darkBlueColor, alignSelf: "center", padding: 20 }}>{i18n.t("areYouSure")}</Text>
                <View style={{ flexDirection: "row", padding: 20 }}>
                    <Button mode="contained" style={{ padding: 5, flex: 0.5, borderRadius: 0, marginRight: 5 }} onPress={async () => {

                    }}>
                        <Text style={styles.text}>{i18n.t("back")}</Text>
                    </Button>
                    <Button mode="contained" icon="trash-can" color="red" dark={true} style={{ padding: 5, flex: 0.5, borderRadius: 0 }}
                        onPress={async () => {

                        }}>
                        <Text style={styles.text}>{i18n.t("delete")}</Text>
                    </Button>
                </View>

            </Modal>
        )
    }

    return (
        <View>
            <Portal>{!!showDeleteDialog && renderDeleteDialog()}</Portal>

            {/* Date Filters */}
            <View style={{ flexDirection: 'row', margin: 10, gap: 10, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, marginBottom: 5, fontWeight: 'bold' }}>{i18n.t("from")}</Text>
                    <TouchableOpacity
                        onPress={() => setShowFromDatePicker(true)}
                        style={{
                            borderWidth: 1,
                            borderColor: Color.GREY[400],
                            padding: 10,
                            borderRadius: 5,
                            backgroundColor: 'white'
                        }}
                    >
                        <Text>{moment(fromDate).format("DD/MM/YYYY")}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, marginBottom: 5, fontWeight: 'bold' }}>{i18n.t("to")}</Text>
                    <TouchableOpacity
                        onPress={() => setShowToDatePicker(true)}
                        style={{
                            borderWidth: 1,
                            borderColor: Color.GREY[400],
                            padding: 10,
                            borderRadius: 5,
                            backgroundColor: 'white'
                        }}
                    >
                        <Text>{moment(toDate).format("DD/MM/YYYY")}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Pickers */}
            {showFromDatePicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onFromDateChange}
                />
            )}
            {showToDatePicker && (
                <DateTimePicker
                    value={toDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onToDateChange}
                />
            )}

            <View style={{ flexDirection: 'row', margin: 10, gap: 10, alignItems: 'center' }}>
                <TextInput
                    placeholder={i18n.t("search")}
                    clearButtonMode="always"
                    style={{ flex: 1 }}
                    value={searchText}
                    onChangeText={(text) => {
                        setSearchText(text);
                        const list = Commons.handleSearch(text, visitsList);
                        setFilteredVisitsList(list);
                    }}
                />
                <Button
                    mode="contained"
                    icon="cloud-download"
                    loading={syncing}
                    disabled={syncing}
                    onPress={syncVisitsFromServer}
                    style={{
                        backgroundColor: syncing ? Color.GREY[400] : Constants.appColor,
                        borderRadius: 8,
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                    }}
                    labelStyle={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        letterSpacing: 0.5,
                        color: 'white',
                    }}
                    contentStyle={{
                        paddingVertical: 4,
                        paddingHorizontal: 8
                    }}
                >
                    {i18n.t("sync")}
                </Button>
            </View>
            <FlatList
                keyExtractor={(item) => item.ID}
                data={filteredVisitsList}
                style={{ backgroundColor: "white", height: "90%" }}
                contentContainerStyle={{ paddingBottom: 80 }}
                extraData={filteredVisitsList}
                renderItem={renderVisitsItem}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    viewContainer: {
        width: "80%",
        marginTop: 80,
    },
    text: { color: "white", fontWeight: "bold", fontSize: 16 },
    taskItemView: curLang => ({
        marginBottom: 5,
        flexDirection: curLang == "ar" ? "row-reverse" : "row",
        justifyContent: "space-between",
        marginHorizontal: 20,

    }),
    cardContainer: {
        display: "flex",
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    modalStyle: {
        backgroundColor: "white",
        padding: 20,
    },
    loginButtonStyle: {
        margin: 2,
        marginLeft: 0,
        marginRight: 0,
    },

    loginButtonContainer: {
        margin: 15,
        width: "100%",
        paddingTop: 15,
        alignSelf: "center",
    },
    image: {
        width: 160,
        height: 195,
        margin: 45,
        marginTop: 40,
        alignSelf: "center",
    },
    appButtonContainer: {
        backgroundColor: Constants.appColor,
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    cardTitle: {
        color: Constants.appColor,
    },
    appButtonText: {
        fontSize: 16,
        color: "#fff",
        fontWeight: "bold",
        alignSelf: "center",
        textTransform: "uppercase",
    },
});
