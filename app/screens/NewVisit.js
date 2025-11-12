import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, Modal, Portal, TextInput, RadioButton, Icon } from "react-native-paper";
import * as ServerOperations from "../utils/ServerOperations";
import * as DocumentPicker from "expo-document-picker";
import * as Commons from "../utils/Commons";
import * as SecureStore from "expo-secure-store";
import { loginTheme } from "../../App.style";
import * as Constants from "../utils/Constants";
import * as Localization from "expo-localization";
import { Ionicons } from "@expo/vector-icons";
import Color, { White } from 'react-native-material-color';
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { Camera, CameraType, useCameraPermissions, CameraView } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
    MenuProvider,
} from "react-native-popup-menu";
import {
    SafeAreaView,
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Text,
    FlatList,
    Alert,
    Platform,
    Linking
} from "react-native";
import i18n from "../languages/langStrings";
import ProgressDialog from "react-native-progress-dialog";
import * as actions from "../actions/newVisit";
import RadioGroup, { RadioButtonProps } from "react-native-radio-buttons-group";
import Capture from "../components/Capture";
import * as ImagePicker from 'expo-image-picker';
import { height, width } from "../utils/Styles";
import * as SQLite from "expo-sqlite";
import moment from 'moment';


TouchableOpacity.defaultProps = { activeOpacity: 0.8 };

const AppButton = ({ onPress, title }) => (
    <TouchableOpacity onPress={onPress} style={styles.appButtonContainer}>
        <Text style={styles.appButtonText}>{title}</Text>
    </TouchableOpacity>
);

export const NewVisitScreen = ({ route, navigation }) => {
    //**Variables**//
    const [singleFile, setSingleFile] = useState("");
    const [allFaces, setAllFaces] = useState("");
    const [notes, setNotes] = useState("");
    const [newProdName, setNewProdName] = useState("");
    const [newProdPrice, setNewProdPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [expDate, setExpDate] = useState("");
    const [expQty, setExpQty] = useState("");
    const [newProdExpDate, setNewProdExpDate] = useState("");
    const [newProdExpQty, setNewProdExpQty] = useState("");
    const [companyFaces, setCompanyFaces] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedCustomerName, setSelectedCustomerName] = useState("");
    const [selectedCustomerLocation, setSelectedCustomerLocation] = useState("");
    const [allowedRadius, setAllowedRadius] = useState(200);
    const [selectedItem, setSelectedItem] = useState("");
    const [searchText, setSearchText] = useState("");
    const [searchTextTask, setSearchTextTask] = useState("");
    const [searchTextCatItems, setSearchTextCatItems] = useState("");
    const [password, setPassword] = useState("");
    const [passwordDB, setPasswordDB] = useState("");
    const [filteredCategoriesList, setFilteredCategoriesList] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [filteredTasksList, setFilteredTasksList] = useState([]);
    const [categoryItemsList, setCategoryItemsList] = useState("");
    const [filteredCatItemsList, setFilteredCatItemsList] = useState([]);
    const [tasksList, setTasksList] = useState([]);
    const [showSelectTaskModal, setShowSelectTaskModal] = useState(false);
    const [showFacesModal, setShowFacesModal] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showExpiryModal, setShowExpiryModal] = useState(false);
    const [showCatItemsModal, setShowCatItemsModal] = useState(false);
    const [progressDialogVisible, setProggressDialogVisible] = useState(false);
    const [progressDialogMessage, setProgressDialogMessage] = useState("");
    const [merchPassModalVisible, setMerchPassModalVisible] = useState(false);
    const [curLang, setCurLang] = useState("");
    const [selectedTask, setSelectedTask] = useState("");
    const [showItemAvlModal, setShowItemAvlModal] = useState(false);
    const [showCaptureModal, setShowCaptureModal] = useState(false);
    const [showCaptureModalPricing, setShowCaptureModalPricing] = useState(false);
    const [showAddToCompListModal, setShowAddToCompListModal] = useState(false);
    const [showAddToExpListModal, setShowAddToExpListModal] = useState(false);
    const [showImageTypeModal, setShowImageTypeModal] = useState(false);
    const [itemAvailable, setItemAvailable] = useState('');
    const [imageType, setImageType] = useState('');
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [initialCompList, setInitialCompList] = useState([]);
    const [compList, setCompList] = useState([]);
    const [initialExpList, setInitialExpList] = useState([]);
    const [expList, setExpList] = useState([]);
    const [showDatePickerModal, setShowDatePickerModal] = useState(false);
    const [date, setDate] = useState(new Date());
    const [inTime, setInTime] = useState("");
    const [outTime, setOutTime] = useState("");
    const [type, setType] = useState('back');
    const [cameraPermission, setCameraPermission] = useCameraPermissions();
    const [camera, setCamera] = useState(null);
    const [passwordOverrideMode, setPasswordOverrideMode] = useState(false);

    // Time tracking states
    const [categoryStartTime, setCategoryStartTime] = useState(null);
    const [taskStartTime, setTaskStartTime] = useState(null);
    const [categoryTimeSpent, setCategoryTimeSpent] = useState(0);
    const [taskTimeSpent, setTaskTimeSpent] = useState(0);
    const categoryTimerRef = React.useRef(null);
    const taskTimerRef = React.useRef(null);

    // Flyer/Offshelf attachment states
    const [showFlyerModal, setShowFlyerModal] = useState(false);
    const [showCaptureModalFlyer, setShowCaptureModalFlyer] = useState(false);
    const [flyerAttachment, setFlyerAttachment] = useState("");

    let photoArray = [];

    // Time tracking utility functions
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startCategoryTimer = async () => {
        if (categoryTimerRef.current) {
            clearInterval(categoryTimerRef.current);
        }

        // Load existing time from DB for this specific visit
        const visitId = await Commons.getFromAS("curVisitID");
        const existingTime = await Commons.getCategoryTimeTracking(visitId, selectedCategory.ID);
        setCategoryTimeSpent(existingTime);
        setCategoryStartTime(Date.now());

        categoryTimerRef.current = setInterval(() => {
            setCategoryTimeSpent(prev => prev + 1);
        }, 1000);
    };

    const stopCategoryTimer = async () => {
        if (categoryTimerRef.current) {
            clearInterval(categoryTimerRef.current);
            categoryTimerRef.current = null;
        }

        if (categoryStartTime && selectedCategory) {
            const visitId = await Commons.getFromAS("curVisitID");
            const elapsed = Math.floor((Date.now() - categoryStartTime) / 1000);
            await Commons.saveTimeTracking(visitId, selectedCategory.ID, "", elapsed);
            setCategoryStartTime(null);
        }
    };

    const startTaskTimer = async () => {
        if (taskTimerRef.current) {
            clearInterval(taskTimerRef.current);
        }

        // Load existing time from DB for this specific visit
        const visitId = await Commons.getFromAS("curVisitID");
        const existingTime = await Commons.getTimeTracking(visitId, selectedCategory.ID, selectedTask.ID);
        setTaskTimeSpent(existingTime);
        setTaskStartTime(Date.now());

        taskTimerRef.current = setInterval(() => {
            setTaskTimeSpent(prev => prev + 1);
        }, 1000);
    };

    const stopTaskTimer = async () => {
        if (taskTimerRef.current) {
            clearInterval(taskTimerRef.current);
            taskTimerRef.current = null;
        }

        if (taskStartTime && selectedTask && selectedCategory) {
            const visitId = await Commons.getFromAS("curVisitID");
            const elapsed = Math.floor((Date.now() - taskStartTime) / 1000);
            await Commons.saveTimeTracking(visitId, selectedCategory.ID, selectedTask.ID, elapsed);
            setTaskStartTime(null);
        }
    };

    // Cleanup timers on unmount
    React.useEffect(() => {
        return () => {
            if (categoryTimerRef.current) clearInterval(categoryTimerRef.current);
            if (taskTimerRef.current) clearInterval(taskTimerRef.current);
        };
    }, []);

    // Monitor category items modal state (this is where task work happens)
    React.useEffect(() => {
        if (showCatItemsModal && selectedCategory && selectedTask) {
            // Only start timers if task is NOT optional
            if (selectedTask.IS_OPTIONAL !== "1" && selectedTask.IS_OPTIONAL !== "true") {
                startCategoryTimer();
                startTaskTimer();
            }
        } else if (!showCatItemsModal) {
            // Stop both timers when modal closes
            stopCategoryTimer();
            stopTaskTimer();
        }
    }, [showCatItemsModal]);

    // Monitor Flyer modal state (for Flyer and Offshelf tasks)
    React.useEffect(() => {
        if (showFlyerModal && selectedCategory && selectedTask) {
            // Only start timers if task is NOT optional
            if (selectedTask.IS_OPTIONAL !== "1" && selectedTask.IS_OPTIONAL !== "true") {
                startCategoryTimer();
                startTaskTimer();
            }
        } else if (!showFlyerModal) {
            // Stop both timers when modal closes
            stopCategoryTimer();
            stopTaskTimer();
        }
    }, [showFlyerModal]);

    const showDatePicker = () => {
        setShowDatePickerModal(true);
        Platform.OS === "ios" ? onChangeDate() : null;
    };

    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePickerModal(Platform.OS === "ios");
        setDate(currentDate);
        if (selectedDate) {
            let tempDate = new Date(currentDate);
            let fDate =
                tempDate.getDate() +
                "/" +
                (tempDate.getMonth() + 1) +
                "/" +
                tempDate.getFullYear();
            setNewProdExpDate(fDate);
        }
    };
    const permisionFunction = async () => {
        // here is how you can get the camera permission
        const cameraPermission = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(cameraPermission.status === "granted");
        if (cameraPermission.status !== "granted") {
            alert("Permission for media access needed.");
        }
    };

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (
            result !== undefined &&
            result !== null &&
            result !== "" &&
            !result.cancelled
        ) {
            // Store the local URI directly without uploading
            setSingleFile(result.uri);
        }
    };

    const selectOneFile = async () => {
        //Opening Document Picker for selection of one file
        const isGranted = await MediaLibrary.getPermissionsAsync();
        console.log(isGranted.granted);
        if (isGranted) {
            try {
                const res = (await DocumentPicker.getDocumentAsync({})).assets[0];
                //Setting the state to show single file attributes
                console.log(res);
                if (res != "" && res != null && res != undefined) {
                    // Store the local URI directly without uploading
                    setSingleFile(res.uri);
                }
            } catch (err) {
            }
        } else {
            MediaLibrary.requestPermissionsAsync();
        }
    };

    const addToCompList = (prod, price) => {
        console.log(compList);
        if (prod == "" || price == "") {
            Commons.okAlert(i18n.t("emptyFields"))
            return;
        }
        let newArray = [...compList];
        if (compList.length > 0) {
            const containsQuery = compList.some((comp) =>
                comp.prod.includes(prod)
            );
            if (containsQuery) {
                Commons.okAlert(i18n.t("productExists"))
                return;
            }
            if (newArray[0].prod == undefined || newArray[0].price == undefined) {
                newArray = newArray.slice(1);
            }
        }
        newArray.push({ prod: prod, price: price });
        setCompList(newArray);
        setInitialCompList(newArray);
        setShowAddToCompListModal(false);
    }

    const addToExpList = (date, qty) => {
        if (date == "" || qty == "") {
            Commons.okAlert(i18n.t("emptyFields"))
            return;
        }
        let newArray = [...expList];
        if (expList.length > 0) {
            const containsQuery = expList.some((comp) =>
                comp.date.includes(date)
            );
            if (containsQuery) {
                Commons.okAlert(i18n.t("dateExists"))
                return;
            }
            if (newArray[0].date == undefined || newArray[0].qty == undefined) {
                newArray = newArray.slice(1);
            }
        }

        newArray.push({ date: date, qty: qty });
        setExpList(newArray);
        setInitialExpList(newArray);
        setShowAddToExpListModal(false);
    }

    const deleteFromCompPriceList = (idToDelete) => {
        setCompList((prevArray) => prevArray.filter((item) => selectedItem.ID + item.prod !== idToDelete));
        //setVisitsList((prevArray) => prevArray.filter((item) => item !== idToDelete));
    }

    const deleteFromExpList = (idToDelete) => {
        setExpList((prevArray) => prevArray.filter((item) => selectedItem.ID + item.date !== idToDelete));
    }

    const handleAddPhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
            });

            if (!result.cancelled && result.assets && result.assets.length > 0) {
                setPhotos((prevPhotos) => [...prevPhotos, result.assets[0].uri]);

            } else {
                console.log('User cancelled taking a photo.');
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
        }
    };

    const handleImageSelect = (selectedUri) => {
        // Set the selected image URI in state or perform any other action
        setSelectedPhoto(selectedUri)
    };

    const handleImageDelete = (imageUriToDelete) => {
        setPhotos((prevArray) => prevArray.filter((uri) => uri !== imageUriToDelete));
    };

    const handleTaskSelection = async (item) => {
        // if (item.TYPE == "Item Availability") {
        //     const taskAvl = await Commons.getTaskAvl(item.ID, selectedCategory.ID);
        //     console.log(taskAvl);
        //     if (taskAvl.length > 0) {
        //         if (taskAvl[0].ITEM_AVAILABLE != null && taskAvl[0].ITEM_AVAILABLE != "") setItemAvailable(taskAvl[0].ITEM_AVAILABLE);
        //     } else {
        //         setItemAvailable("");
        //     }
        //     setShowItemAvlModal(true);
        // }
        if (item.TYPE == "Photos") {
            //setShowCaptureModal(true);
            setShowImageTypeModal(true);
        }
        if (item.TYPE == "Flyer" || item.TYPE == "Offshelf") {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("loadingAttachment"));

            // Load appropriate attachment based on task type
            if (item.TYPE == "Flyer") {
                const attachment = await Commons.getFlyerAttachment(selectedCategory.ID, item.ID);
                if (attachment.length > 0) {
                    setFlyerAttachment(attachment[0].FLYER_ATTACHMENT);
                } else {
                    setFlyerAttachment("");
                }
            } else if (item.TYPE == "Offshelf") {
                const attachment = await Commons.getOffshelfAttachment(selectedCategory.ID, item.ID);
                if (attachment.length > 0) {
                    setFlyerAttachment(attachment[0].OFFSHELF_ATTACHMENT);
                } else {
                    setFlyerAttachment("");
                }
            }

            setProggressDialogVisible(false);
            setShowFlyerModal(true);
        }
        if (item.TYPE == "Shelf Share" || item.TYPE == "Pricing" || item.TYPE == "Expiry" || item.TYPE == "Item Availability") {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("loadingItems"));
            const catItems = await Commons.getCategoryItemsDB(selectedCategory.ID, item.ID);
            if (catItems.length > 0) {
                setCategoryItemsList(catItems);
                setFilteredCatItemsList(catItems);
                if (catItems[0].VISIT_ID == undefined) {
                    await Commons.addItemsToVisit(catItems, item.ID);
                };
            } else {
                setCategoryItemsList([]);
                setFilteredCatItemsList([]);
            }
            setShowCatItemsModal(true);
            setProggressDialogVisible(false);
        }

    }

    const handleTakePic = async () => {
        if (camera) {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("takingPicture"));
            const res = await camera.takePictureAsync({ quality: 0 });
            if (res !== undefined && res !== null && res !== "") {
                // Store the local URI directly without uploading
                const uri = res.uri;
                setSingleFile(uri);
                setShowCaptureModalPricing(false);
                setProggressDialogVisible(false);
            }
            setProggressDialogVisible(false);
        }
    };

    const handleTakePicFlyer = async () => {
        if (camera) {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("takingPicture"));
            const res = await camera.takePictureAsync({ quality: 0 });
            if (res !== undefined && res !== null && res !== "") {
                // Store the local URI directly without uploading
                const uri = res.uri;
                setFlyerAttachment(uri);
                setShowCaptureModalFlyer(false);
                setProggressDialogVisible(false);
            }
            setProggressDialogVisible(false);
        }
    };

    const handleCategoryItemSelect = async (item) => {
        if (selectedTask.TYPE == "Shelf Share") {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("loadingItemDetails"));
            setSelectedItem(item);
            const allFaces = await Commons.getItemAllFaces(item.ID, selectedCategory.ID, selectedTask.ID);
            const compFaces = await Commons.getItemCompanyFaces(item.ID, selectedCategory.ID, selectedTask.ID);
            if (allFaces.length > 0) {
                setAllFaces(allFaces[0].ALL_FACES);
            } else {
                setAllFaces("");
            }
            if (compFaces.length > 0) {
                setCompanyFaces(compFaces[0].COMPANY_FACES);
            } else {
                setCompanyFaces("");
            }
            setShowFacesModal(true);
            setProggressDialogVisible(false);
        }

        if (selectedTask.TYPE == "Pricing") {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("loadingItemDetails"));
            const sellingPrice = await Commons.getItemSellingPrice(item.ID, selectedCategory.ID, selectedTask.ID);
            const attachment = await Commons.getPricingAttachment(item.ID, selectedCategory.ID, selectedTask.ID);
            let compProdList = await Commons.getCompProdList(item.ID, selectedCategory.ID, selectedTask.ID);
            if (compProdList.length > 0) {
                compProdList = compProdList[0].COMP_PROD_LIST
                compProdList = compProdList.split("$$");
                let cList = [];
                compProdList.map((pItem) => {
                    const item = pItem.split("@@");
                    cList.push({ prod: item[0], price: item[1] });
                })
                if (cList[0].prod == undefined || cList[0].price == undefined) {
                    cList = cList.slice(1);
                }
                if (cList[0] == "") {
                    const newArr = cList.slice(1);
                    setInitialCompList(newArr);
                    setCompList(newArr);
                } else {
                    setInitialCompList(cList);
                    setCompList(cList);
                }
            } else {
                setInitialCompList([]);
                setCompList([]);
            }
            if (sellingPrice.length > 0) {
                setSellingPrice(sellingPrice[0].SELLING_PRICE);
            } else {
                setSellingPrice("");
            }
            if (attachment.length > 0) {
                setSingleFile(attachment[0].PRICING_ATTACHMENT);
            } else {
                setSingleFile("");
            }

            setSelectedItem(item);
            setShowPricingModal(true);
            setProggressDialogVisible(false);
        }
        if (selectedTask.TYPE == "Expiry") {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("loadingItemDetails"));
            let expiryList = await Commons.getExpList(item.ID, selectedCategory.ID, selectedTask.ID);
            if (expiryList.length > 0) {
                expiryList = expiryList[0].EXPIRY_LIST
                expiryList = expiryList.split("$$");
                let cList = [];
                expiryList.map((pItem) => {
                    const item = pItem.split("@@");
                    cList.push({ date: item[0], qty: item[1] });
                })
                if (cList[0].date == undefined || cList[0].qty == undefined) {
                    cList = cList.slice(1);
                }
                if (cList[0] == "") {
                    const newArr = cList.slice(1);
                    setInitialExpList(newArr);
                    setExpList(newArr);
                } else {
                    setInitialExpList(cList);
                    setExpList(cList);
                }
            } else {
                setInitialExpList([]);
                setExpList([]);
            }
            setSelectedItem(item);
            setShowExpiryModal(true);
            setProggressDialogVisible(false);
        }

    }

    function calcCrow(lat1, lon1, lat2, lon2) {
        var R = 6371; // km
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var lat1 = toRad(lat1);
        var lat2 = toRad(lat2);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d * 1000;
    }

    function toRad(Value) {
        return (Value * Math.PI) / 180;
    }

    const getCurrentLocation = async (retries = 5) => {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
        try {
            const geolocation = await Promise.race([
                Location.getCurrentPositionAsync({
                    enableHighAccuracy: true,
                    accuracy: Location.Accuracy.Balanced,
                }),
                timeout,
            ]);

            if (geolocation && geolocation.coords) {
                const { latitude, longitude, accuracy } = geolocation.coords;

                const loc = `${latitude},${longitude}`;
                console.log('Current position:', loc, 'accuracy(m):', accuracy);
                return { location: loc, accuracy: accuracy };
            } else {
                throw new Error('Invalid position data');
            }
        } catch (error) {
            if (error.message === 'Timeout' && retries > 0) {
                console.log('Timeout occurred, retrying getCurrentPositionAsync');
                await new Promise(r => setTimeout(r, 1000));
                return await getCurrentLocation(retries - 1);
            }
            console.log('getCurrentLocation error', error);

            if (error.message.includes('permission')) {
                Alert.alert(i18n.t("error"), i18n.t("locationPermissionDenied"));
            } else if (error.message.includes('timeout') || error.message === 'Timeout') {
                Alert.alert(i18n.t("error"), i18n.t("locationUnavailable") + " - " + i18n.t("timeout"));
            } else {
                Alert.alert(i18n.t("error"), i18n.t("locationUnavailable"));
            }
            return null;
        }
    }

    const checkDistance = async (loc, radiusToCheck = allowedRadius) => {
        if (!loc || loc === "") {
            setProggressDialogVisible(false);
            Commons.okAlert(i18n.t("noLocationAvailable"));
            navigation.navigate("Main");
            return;
        }

        setProggressDialogVisible(true);
        try {
            const locationData = await getCurrentLocation();
            if (!locationData) {
                setProggressDialogVisible(false);
                return;
            }

            const { location: curLocation, accuracy } = locationData;

            let lat1 = loc.split(",")[0];
            let long1 = loc.split(",")[1];
            let lat2 = curLocation.split(",")[0];
            let long2 = curLocation.split(",")[1];
            let distance = calcCrow(lat1, long1, lat2, long2);
            //console.log(loc + " " + curLocation);
            console.log(distance);
            console.log("Allowed radius:", radiusToCheck);
            if (distance > radiusToCheck) {
                setProggressDialogVisible(false);
                const distanceMsg = i18n.t("outsideLocation") + "\n\n" +
                    i18n.t("distance") + ": " + Math.round(distance) + "m\n" +
                    i18n.t("accuracy") + ": " + Math.round(accuracy) + "m";
                Commons.okAlert(i18n.t("error"), distanceMsg);
                navigation.navigate("Main");
            } else {
                setProggressDialogVisible(false);
            }
        } catch (error) {
            setProggressDialogVisible(false);
            console.error("Location error:", error);
            Commons.okAlert(i18n.t("locationError"));
            navigation.navigate("Main");
        }
    }

    const continueLoadingVisit = async () => {
        try {
            const cust = await Commons.getFromAS("selectedCustomer");

            // Check and sync visits if server has newer data
            setProgressDialogMessage(i18n.t("checkingForUpdates"));
            const user = await Commons.getFromAS("userID");
            const syncResult = await Commons.checkAndSyncVisits(user);
            if (syncResult.synced) {
                console.log('Synced visits:', syncResult.message);
                setProggressDialogVisible(false);
                Commons.okAlert(
                    i18n.t("sequenceMismatch"),
                    i18n.t("sequenceMismatchMessage"),
                    true,
                    () => {
                        navigation.navigate("Main");
                    }
                );
                return;
            }

            setProgressDialogMessage(i18n.t("loadingCategories"));
            const catlist = await Commons.getCategoriesDB();
            if (catlist.length > 0) {
                const user = await Commons.getFromAS("userID");
                const currentDate = moment();
                const categoriesWithTasks = [];
                for (const cat of catlist) {
                    const tasks = await Commons.getTasksDB(user, cust, cat.ID);
                    const validTasks = tasks.filter(task => {
                        if (!task.FDT || !task.TDT) return true;
                        const fromDate = moment(task.FDT, 'DD/MM/YYYY');
                        const toDate = moment(task.TDT, 'DD/MM/YYYY');
                        return currentDate.isSameOrAfter(fromDate, 'day') && currentDate.isSameOrBefore(toDate, 'day');
                    });
                    if (validTasks.length > 0) {
                        categoriesWithTasks.push(cat);
                    }
                }
                setCategoriesList(categoriesWithTasks);
                setFilteredCategoriesList(categoriesWithTasks);
                if (catlist[0].VISIT_ID == undefined) {
                    await Commons.addCategoriesToVisit(catlist);
                }
            }

            const curLang = await Commons.getFromAS("lang");
            setCurLang(curLang);

            // Load visit times and notes
            const visitRes = await Commons.getVisitTimeDB(route.params.visitID);
            if (visitRes.length > 0) {
                const startTime = visitRes[0].IN_TIME;
                if (startTime != undefined && startTime != null) setInTime(startTime);
                const endTime = visitRes[0].OUT_TIME;
                if (endTime != undefined && endTime != null) setOutTime(endTime);
            }

            const notesRes = await Commons.getNotesDB(route.params.visitID);
            let notes = ''
            if (notesRes.length > 0) notes = notesRes[0].NOTES
            setNotes(notes);

            setProggressDialogVisible(false);
        } catch (error) {
            console.error("Error continuing visit load:", error);
            setProggressDialogVisible(false);
        }
    }

    useEffect(() => {
        (async () => {
            setProggressDialogVisible(true);
            setProgressDialogMessage(i18n.t("loadingCustomerData"));
            const cust = await Commons.getFromAS("selectedCustomer");
            setSelectedCustomer(cust);

            // Get customer name from database
            const customerData = await Commons.getCustomerByCodeDB(cust);
            if (customerData && customerData.length > 0) {
                setSelectedCustomerName(customerData[0].NAME);
            }

            // Check if this is an existing visit (from MyVisits)
            const visitRes = await Commons.getVisitTimeDB(route.params.visitID);
            const isExistingVisit = visitRes.length > 0 && visitRes[0].IN_TIME;
            const isPostedVisit = visitRes.length > 0 && visitRes[0].OUT_TIME;

            // Get customer location from API only
            setProgressDialogMessage(i18n.t("gettingLocation"));
            const custResp = await ServerOperations.getCustomerLocation(cust);
            if (!custResp || custResp.loc === "" || !custResp.loc) {
                setProggressDialogVisible(false);
                Commons.okAlert(i18n.t("noLocationAvailable"));
                navigation.navigate("Main");
                return;
            }

            const loc = custResp.loc;
            const radius = custResp.radius || 200;
            setSelectedCustomerLocation(loc);
            console.log("Allowed radius from API:", radius);
            setAllowedRadius(radius);

            // Check distance - skip for posted visits, check for existing visits outside radius
            if (isExistingVisit && !isPostedVisit) {
                setProgressDialogMessage(i18n.t("checkingDistance"));
                try {
                    const locationData = await getCurrentLocation();
                    if (locationData) {
                        const { location: curLocation, accuracy } = locationData;
                        let lat1 = loc.split(",")[0];
                        let long1 = loc.split(",")[1];
                        let lat2 = curLocation.split(",")[0];
                        let long2 = curLocation.split(",")[1];
                        let distance = calcCrow(lat1, long1, lat2, long2);

                        if (distance > radius) {
                            // Outside radius - update passwords from server then check for password
                            setProgressDialogMessage(i18n.t("checkingForUpdates"));
                            try {
                                const visitPasses = await ServerOperations.getVisitPasswords();
                                await Commons.loadVisitPasswords(visitPasses);
                            } catch (error) {
                                console.error("Error updating visit passwords:", error);
                                // Continue anyway to check local passwords
                            }

                            setProgressDialogMessage(i18n.t("checkingDistance"));
                            const curUser = await Commons.getFromAS("userID");
                            const date = moment().format('DD/MM/YYYY');
                            const merchPass = await Commons.getMerchPasswordsDB(cust, curUser, date);

                            if (merchPass.length > 0) {
                                // Password exists - show password dialog
                                setProggressDialogVisible(false);
                                setPasswordDB(merchPass[0].PASSWORD);
                                setMerchPassModalVisible(true);
                                // Wait for password verification before continuing
                                return;
                            } else {
                                // No password - cannot proceed
                                setProggressDialogVisible(false);
                                const distanceMsg = i18n.t("outsideLocation") + "\n\n" +
                                    i18n.t("distance") + ": " + Math.round(distance) + "m\n" +
                                    i18n.t("accuracy") + ": " + Math.round(accuracy) + "m";
                                Commons.okAlert(i18n.t("error"), distanceMsg);
                                navigation.navigate("Main");
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.error("Location check error:", error);
                    // Continue anyway for existing visits
                }
            } else if (!isExistingVisit) {
                // New visit - use normal distance check
                setProgressDialogMessage(i18n.t("checkingDistance"));
                await checkDistance(loc, radius);
            }

            // Check and sync visits if server has newer data
            setProgressDialogMessage(i18n.t("checkingForUpdates"));
            const user = await Commons.getFromAS("userID");
            const syncResult = await Commons.checkAndSyncVisits(user);
            if (syncResult.synced) {
                console.log('Synced visits:', syncResult.message);
                setProggressDialogVisible(false);
                Commons.okAlert(
                    i18n.t("sequenceMismatch"),
                    i18n.t("sequenceMismatchMessage"),
                    true,
                    () => {
                        navigation.navigate("Main");
                    }
                );
                return;
            }

            setProgressDialogMessage(i18n.t("loadingCategories"));
            const catlist = await Commons.getCategoriesDB();
            if (catlist.length > 0) {
                // Filter categories to only show those with valid tasks (within date range)
                const user = await Commons.getFromAS("userID");
                const currentDate = moment();
                const categoriesWithTasks = [];
                for (const cat of catlist) {
                    const tasks = await Commons.getTasksDB(user, cust, cat.ID);
                    // Filter tasks based on current date within FDT and TDT range
                    const validTasks = tasks.filter(task => {
                        if (!task.FDT || !task.TDT) return true; // Include tasks without dates
                        const fromDate = moment(task.FDT, 'DD/MM/YYYY');
                        const toDate = moment(task.TDT, 'DD/MM/YYYY');
                        return currentDate.isSameOrAfter(fromDate, 'day') && currentDate.isSameOrBefore(toDate, 'day');
                    });
                    if (validTasks.length > 0) {
                        categoriesWithTasks.push(cat);
                    }
                }
                setCategoriesList(categoriesWithTasks);
                setFilteredCategoriesList(categoriesWithTasks);
                if (catlist[0].VISIT_ID == undefined) {
                    await Commons.addCategoriesToVisit(catlist);
                };
            }

            const curLang = await Commons.getFromAS("lang");
            setCurLang(curLang);
            if (route.params.visitID != null && route.params.visitID != "") {
                await Commons.saveToAS("curVisitID", route.params.visitID);
            }
            const notesRes = await Commons.getNotesDB(route.params.visitID);
            let notes = ''
            if (notesRes.length > 0) notes = notesRes[0].NOTES
            setNotes(notes);

            console.log(visitRes);
            if (visitRes.length > 0) {
                const startTime = visitRes[0].IN_TIME;
                if (startTime != undefined && startTime != null) setInTime(startTime);
                const endTime = visitRes[0].OUT_TIME;
                if (endTime != undefined && endTime != null) setOutTime(endTime);
            }
            setProggressDialogVisible(false);
        })();
    }, []);


    const radioButtonsAvl = useMemo(() => ([
        {
            id: 'available', // acts as primary key, should be unique and non-empty string
            label: i18n.t("Available"),
            value: 'available',
            color: Constants.appColor,
        },
        {
            id: 'notAvailable',
            label: i18n.t("notAvailable"),
            value: 'notAvailable',
            color: Constants.appColor,
            alignSelf: "flex-start"
        }
    ]), []);

    const radioButtonsImageType = useMemo(() => ([
        {
            id: 'before', // acts as primary key, should be unique and non-empty string
            label: i18n.t("before"),
            value: 'before',
            color: Constants.appColor,
        },
        {
            id: 'after',
            label: i18n.t("after"),
            value: 'after',
            color: Constants.appColor,
            alignSelf: "flex-start"
        }
    ]), []);

    const renderDatePickerModal = useMemo(() => {
        if (!showDatePickerModal) return null;
        return (
            <Modal
                visible={true}
                onDismiss={() => setShowDatePickerModal(false)}
                contentContainerStyle={styles.modalStyle}
            >
                <DateTimePicker
                    testID="datePicker"
                    value={date}
                    mode={"date"}
                    display="default"
                    onChange={onChangeDate}
                    style={styles.datetimepickerstyle}
                />
            </Modal>
        );
    }, [showDatePickerModal, date]);

    //** Capture Modal **
    const renderCaptureModal = () => {
        return (
            <Modal
                visible={true}
                dismissable={false}
                contentContainerStyle={{ paddingVertical: 10 }}
            >
                <View style={{ backgroundColor: Constants.appColor, paddingHorizontal: 15, flexDirection: "row" }}>
                    <TouchableOpacity onPress={handleAddPhoto} >
                        <Ionicons name="camera" style={{ padding: 10 }} size={26} color={White} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { handleImageDelete(selectedPhoto) }} >
                        <Ionicons name="trash-bin" style={{ padding: 10 }} size={26} color="red" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={photos}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ backgroundColor: "white", height: height / 2 }}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleImageSelect(item)} style={{ borderWidth: item == selectedPhoto ? 1 : 0, borderColor: "white" }} >
                            <Image source={{ uri: item }} style={{ width: width / 2, height: height / 6 }} />
                        </TouchableOpacity>
                    )}
                />
                <Ionicons name="close" size={24} color="white" style={{ position: "absolute", top: 0, padding: 20, right: 0 }} onPress={async () => {
                    setShowCaptureModal(false);
                }} />
                <View style={{ backgroundColor: "white" }}>
                    <Button mode="contained" style={{ padding: 10, backgroundColor: Constants.appColor }}
                        onPress={async () => {
                            console.log(photos);
                            if (photos.length > 0) {
                                if (imageType == "before") {
                                    await Commons.setImagesBefore(photos.join("@@"), selectedTask.ID, selectedTask.DESC, selectedTask.TYPE, selectedCategory.ID);
                                } else {
                                    await Commons.setImagesAfter(photos.join("@@"), selectedTask.ID, selectedTask.DESC, selectedTask.TYPE, selectedCategory.ID);
                                }
                            }
                            setShowCaptureModal(false);
                            setPhotos([]);
                        }}>
                        <Text style={styles.text}> {i18n.t("confirm")} </Text>
                    </Button>
                </View>
            </Modal >
        );
    }
    const renderCaptureModalPricing = () => {
        return (
            <Modal
                contentContainerStyle={styles.modalStyle}
                dismissable={false}
                visible={true}
            >
                <View
                    style={{
                        position: "absolute",
                        left: 5,
                        right: 5,
                        zIndex: 100,
                    }}
                >
                    <CameraView
                        ref={(ref) => setCamera(ref)}
                        type={type}
                        quality={0.5}
                        style={{ flex: 1, aspectRatio: 1 }}
                    />
                    <Button onPress={handleTakePic} icon="camera" mode="contained" labelStyle={{ color: "white" }}>
                        <Text style={styles.text}>
                            {i18n.t("takePicture")}
                        </Text>
                    </Button>
                </View>
            </Modal>
        );
    }

    const renderCaptureModalFlyer = () => {
        return (
            <Modal
                contentContainerStyle={styles.modalStyle}
                dismissable={false}
                visible={true}
            >
                <View
                    style={{
                        position: "absolute",
                        left: 5,
                        right: 5,
                        zIndex: 100,
                    }}
                >
                    <CameraView
                        ref={(ref) => setCamera(ref)}
                        type={type}
                        quality={0.5}
                        style={{ flex: 1, aspectRatio: 1 }}
                    />
                    <Button onPress={handleTakePicFlyer} icon="camera" mode="contained" labelStyle={{ color: "white" }}>
                        <Text style={styles.text}>
                            {i18n.t("takePicture")}
                        </Text>
                    </Button>
                </View>
            </Modal>
        );
    }

    const renderMerchPassModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <View>
                    <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
                        {i18n.t("enterPasswordToContinue")}
                    </Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder={i18n.t("password")}
                        style={{ marginHorizontal: 5 }}
                        secureTextEntry
                    />
                    <View style={{ flexDirection: "row", marginTop: 15 }}>
                        <Button
                            style={{ marginRight: 5, flex: 1 }}
                            mode="outlined"
                            onPress={() => {
                                setMerchPassModalVisible(false);
                                navigation.navigate("Main");
                            }}
                        >
                            <Text>{i18n.t("cancel")}</Text>
                        </Button>
                        <Button
                            style={{ flex: 1 }}
                            mode="contained"
                            onPress={async () => {
                                if (passwordDB == password) {
                                    setPasswordOverrideMode(true);
                                    setMerchPassModalVisible(false);
                                    // Continue loading the visit in restricted mode
                                    setProggressDialogVisible(true);
                                    await continueLoadingVisit();
                                    setProggressDialogVisible(false);
                                } else {
                                    Commons.okAlert(i18n.t("incorrectPass"));
                                }
                            }}
                        >
                            <Text style={styles.text}>
                                {i18n.t("confirm")}
                            </Text>
                        </Button>
                    </View>
                </View>
            </Modal>
        );
    }

    //** Image Type Modal **
    const renderImageTypeModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowImageTypeModal(false);
                    setPhotos([]);
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <View style={{ padding: 20 }}>
                    <RadioGroup
                        radioButtons={radioButtonsImageType}
                        onPress={setImageType}
                        selectedId={imageType}
                        containerStyle={{
                            alignItems: "flex-start",
                            width: "100%",
                            padding: 5,
                        }}
                        labelStyle={{
                            fontSize: 16,
                        }}
                    />
                    <Button mode="contained" style={{ marginTop: 20, marginHorizontal: 70, backgroundColor: Constants.appColor }}
                        onPress={async () => {
                            if (imageType != "") {
                                let imgsBefore = await Commons.getTaskImagesBefore(selectedTask.ID, selectedCategory.ID);
                                let imgsAfter = await Commons.getTaskImagesAfter(selectedTask.ID, selectedCategory.ID);
                                setPhotos([]);
                                if (imgsBefore.length > 0) {
                                    imgsBefore = imgsBefore[0].IMAGES_BEFORE;
                                    if (imageType == "before" && imgsBefore != undefined && imgsBefore != null) setPhotos(imgsBefore.split("@@"));
                                }

                                if (imgsAfter.length > 0) {
                                    imgsAfter = imgsAfter[0].IMAGES_AFTER;
                                    if (imageType == "after" && imgsAfter != undefined && imgsAfter != null) setPhotos(imgsAfter.split("@@"));
                                }
                                setShowImageTypeModal(false);
                                setShowCaptureModal(true);
                            }
                        }}>
                        <Text style={styles.text}> {i18n.t("confirm")} </Text>
                    </Button>
                    <Ionicons name="close" size={24} style={{ position: "absolute", top: 0, right: 0 }} onPress={async () => {
                        setShowImageTypeModal(false);
                    }} />
                </View>

            </Modal >
        );
    }

    //** Add To Complist Modal **
    const renderAddToCompListModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowAddToCompListModal(false);
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
                    {i18n.t("product")}
                </Text>
                <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: "row" }}>
                        <TextInput
                            label={i18n.t("name")}
                            value={newProdName}
                            onChangeText={setNewProdName}
                            style={{ flex: 0.5 }}
                        />
                        <TextInput
                            label={i18n.t("price")}
                            value={newProdPrice}
                            keyboardType="numeric"
                            onChangeText={setNewProdPrice}
                            style={{ flex: 0.5, marginLeft: 10 }}
                        />
                    </View>
                    <View style={{ marginTop: 20, flexDirection: "row-reverse" }}>

                        <Button mode="contained" style={{ flex: 0.5 }}
                            onPress={() => {
                                addToCompList(newProdName, newProdPrice);
                            }}>
                            <Text style={styles.text}> {i18n.t("confirm")} </Text>
                        </Button>
                        <Button mode="contained" style={{ flex: 0.5, marginRight: 5 }} onPress={async () => {
                            setShowAddToCompListModal(false);
                        }}>
                            <Text style={styles.text}>{i18n.t("back")}</Text>
                        </Button>
                    </View>
                </View>
            </Modal >
        );
    }

    //** Add To Expiry List Modal **
    const renderAddToExpListModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowAddToExpListModal(false);
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
                    {i18n.t("addDate")}
                </Text>
                <View style={{ padding: 20 }}>
                    <View>
                        <Button
                            mode="outlined"
                            style={{ borderColor: "rgb(1,135,134)" }}
                            onPress={showDatePicker}
                        >
                            {i18n.t("expDate")}
                        </Button>
                        <Text style={{
                            fontSize: 18,
                            padding: 10,
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                        }}>{newProdExpDate}</Text>
                        <TextInput
                            label={i18n.t("qty")}
                            value={newProdExpQty}
                            keyboardType="numeric"
                            onChangeText={setNewProdExpQty}
                            style={{ marginLeft: 10, marginTop: 20 }}
                            returnKeyType="done"
                            blurOnSubmit={true}
                        />
                    </View>
                    <View style={{ marginTop: 20, flexDirection: "row-reverse" }}>

                        <Button mode="contained" style={{ flex: 0.5 }}
                            onPress={() => {
                                addToExpList(newProdExpDate, newProdExpQty);
                            }}>
                            <Text style={styles.text}> {i18n.t("confirm")} </Text>
                        </Button>
                        <Button mode="contained" style={{ flex: 0.5, marginRight: 5 }} onPress={async () => {
                            setShowAddToExpListModal(false);
                        }}>
                            <Text style={styles.text}>{i18n.t("back")}</Text>
                        </Button>
                    </View>
                </View>

            </Modal >
        );
    }

    //** Faces Modal **
    const renderFacesModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowFacesModal(false);
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
                    {i18n.t("faces")}
                </Text>
                <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: "row" }}>
                        <TextInput
                            label={i18n.t("all")}
                            value={allFaces}
                            keyboardType="numeric"
                            onChangeText={setAllFaces}
                            style={{ flex: 0.5 }}
                        />
                        <TextInput
                            label={i18n.t("company")}
                            value={companyFaces}
                            keyboardType="numeric"
                            onChangeText={setCompanyFaces}
                            style={{ flex: 0.5, marginLeft: 10 }}
                        />
                    </View>
                    {allFaces != "" && allFaces != 0 && (<Text style={[styles.text, { color: Constants.greenColor, alignSelf: "flex-end", marginTop: 20, marginBottom: 10 }]}>
                        {i18n.t("companyPer")} {Number((companyFaces / allFaces * 100).toFixed(2))} {"%"}
                    </Text>)}
                    <Button mode="contained" style={{ marginTop: 20, marginHorizontal: 70, backgroundColor: Constants.appColor }}
                        onPress={async () => {
                            await Commons.setItemAllFaces(selectedItem.ID, allFaces, selectedItem.DESC, selectedCategory.ID, selectedTask.ID);
                            await Commons.setItemCompanyFaces(selectedItem.ID, companyFaces, selectedItem.DESC, selectedCategory.ID, selectedTask.ID);
                            setShowFacesModal(false);
                        }}>
                        <Text style={styles.text}> {i18n.t("confirm")} </Text>
                    </Button>
                </View>

            </Modal >
        );
    }
    //** Pricing Modal **
    const renderPricingModal = () => {
        return (
            <Modal
                visible={true}
                dismissable={false}
                contentContainerStyle={[styles.modalStyle]}
            >
                <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
                    {i18n.t("pricing")}
                </Text>
                <View style={{ marginTop: 20, marginHorizontal: 15 }}>
                    <Button
                        style={{ backgroundColor: Constants.darkBlueColor }}
                        mode="contained"
                        onPress={() => setShowCaptureModalPricing(true)}
                    >
                        <View style={{ flexDirection: 'row' }}>
                            <Ionicons name="camera" size={24} color={White} />
                            <Text style={styles.text}>  {i18n.t("takePicture")} </Text>
                        </View>
                    </Button>
                </View>
                {singleFile && (
                    <View style={{ marginTop: 20, alignItems: "center" }}>
                        <Image
                            source={{ uri: singleFile }}
                            style={{ width: width * 0.8, height: height * 0.3, resizeMode: "contain" }}
                        />
                        <Button
                            mode="outlined"
                            style={{ marginTop: 10, borderColor: "red" }}
                            onPress={() => {
                                Commons.confirmAlert(i18n.t("areYouSure"), "", () => {
                                    setSingleFile("");
                                });
                            }}
                        >
                            <View style={{ flexDirection: 'row' }}>
                                <Ionicons name="trash" size={20} color="red" />
                                <Text style={{ color: "red" }}>  {i18n.t("delete")} </Text>
                            </View>
                        </Button>
                    </View>
                )}
                <View style={{ padding: 20 }}>
                    <TextInput
                        placeholder={i18n.t("sellingPrice")}
                        value={sellingPrice}
                        keyboardType="numeric"
                        onChangeText={setSellingPrice}
                        style={{ marginHorizontal: "24%", textAlign: "center", marginBottom: "20%" }}
                        returnKeyType="done"
                        blurOnSubmit={true}
                    />
                    {/* <View>
                        <Button mode="contained" style={{ marginTop: 20, backgroundColor: Constants.darkBlueColor, marginBottom: 10 }} onPress={() => {
                            setShowAddToCompListModal(true);
                            setNewProdName("");
                            setNewProdPrice("")
                        }}>
                            <View style={{ flexDirection: 'row' }}>
                                <Ionicons name="add" size={24} color={White} />
                                <Text style={styles.text}>  {i18n.t("compProducts")} </Text>
                            </View>
                        </Button>
                        <FlatList
                            keyExtractor={item => (selectedItem.ID + item.prod)}
                            data={compList}
                            style={{ height: height / 3 }}
                            renderItem={({ item }) => {
                                return (
                                    <View
                                        style={{
                                            paddingHorizontal: 15,
                                            paddingVertical: 25,
                                            marginBottom: 10,
                                            backgroundColor: Color.GREY[50],
                                            borderWidth: StyleSheet.hairlineWidth,
                                            borderColor: Color.GREY[500],
                                        }}
                                    >
                                        <View style={styles.taskItemView(curLang)}>
                                            <Text>{i18n.t("product")}</Text>
                                            <Text>{item.prod}</Text>
                                        </View>
                                        <View style={styles.taskItemView(curLang)}>
                                            <Text>{i18n.t("price")}</Text>
                                            <Text>{item.price}</Text>
                                        </View>
                                        <TouchableOpacity style={{ position: "absolute", top: 0, right: 0 }} onPress={() => {
                                            Commons.confirmAlert(i18n.t("areYouSure"), "", () => {
                                                deleteFromCompPriceList(selectedItem.ID + item.prod);
                                            })
                                        }}>
                                            <Ionicons name="trash" size={18} color="white" style={{ color: "red", borderRadius: 0, padding: 5 }} />
                                        </TouchableOpacity>
                                    </View>
                                )
                            }}
                        />
                    </View> */}
                    <View style={{ flexDirection: "row-reverse" }}>
                        <Button mode="contained" style={{ backgroundColor: Constants.appColor, flex: 0.5 }}
                            onPress={async () => {
                                await Commons.setItemSellingPrice(selectedItem.ID, sellingPrice, selectedItem.DESC, selectedCategory.ID, selectedTask.ID);
                                await Commons.setPricingAttachment(selectedItem.ID, singleFile, selectedItem.DESC, selectedCategory.ID, selectedTask.ID);
                                // let list = [];
                                // compList.map((item) => {
                                //     list.push(item.prod + "@@" + item.price);
                                // })
                                // list = list.join("$$");
                                // await Commons.setCompProdList(selectedItem.ID, list, selectedItem.DESC, selectedCategory.ID, selectedTask.ID);
                                // setInitialCompList([]);
                                // setCompList([]);
                                setSingleFile("");
                                setShowPricingModal(false);
                            }}
                        >
                            <Text style={styles.text}> {i18n.t("confirm")} </Text>
                        </Button>
                        <Button mode="contained" style={{ flex: 0.5, marginRight: 5 }} onPress={async () => {
                            setShowPricingModal(false);
                        }}>
                            <Text style={styles.text}>{i18n.t("back")}</Text>
                        </Button>
                    </View>
                </View>
            </Modal >
        );
    }

    const renderExpiryModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowExpiryModal(false);
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <Text style={{ textAlign: "center", fontSize: 16, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
                    {i18n.t("expiry")}
                </Text>
                <View style={{ padding: 20 }}>
                    {/* <TextInput
                        placeholder={i18n.t("expDate")}
                        value={expDate}
                        onChangeText={setExpDate}
                        style={{ marginHorizontal: "24%", textAlign: "center" }}
                    />
                    <TextInput
                        placeholder={i18n.t("qty")}
                        value={expQty}
                        keyboardType="numeric"
                        onChangeText={setExpQty}
                        style={{ marginHorizontal: "24%", textAlign: "center" }}
                    /> */}
                    <View>
                        <Button mode="contained" style={{ marginTop: 20, backgroundColor: Constants.darkBlueColor, marginBottom: 10 }} onPress={() => {
                            setShowAddToExpListModal(true);
                            setNewProdExpDate("");
                            setNewProdExpQty("")
                        }}>
                            <View style={{ flexDirection: 'row' }}>
                                <Ionicons name="add" size={24} color={White} />
                                <Text style={styles.text}>  {i18n.t("addDate")} </Text>
                            </View>
                        </Button>
                        <FlatList
                            keyExtractor={item => (selectedItem.ID + item.date)}
                            data={expList}
                            style={{ height: height / 3 }}
                            renderItem={({ item }) => {
                                return (
                                    <View
                                        style={{
                                            paddingHorizontal: 15,
                                            paddingVertical: 25,
                                            marginBottom: 10,
                                            backgroundColor: Color.GREY[50],
                                            borderWidth: StyleSheet.hairlineWidth,
                                            borderColor: Color.GREY[500],
                                        }}
                                    >
                                        <View style={styles.taskItemView(curLang)}>
                                            <Text>{i18n.t("expDate")}</Text>
                                            <Text>{item.date}</Text>
                                        </View>
                                        <View style={styles.taskItemView(curLang)}>
                                            <Text>{i18n.t("qty")}</Text>
                                            <Text>{item.qty}</Text>
                                        </View>
                                        <TouchableOpacity style={{ position: "absolute", top: 0, right: 0 }} onPress={() => {
                                            Commons.confirmAlert(i18n.t("areYouSure"), "", () => {
                                                deleteFromExpList(selectedItem.ID + item.date);
                                            })
                                        }}>
                                            <Ionicons name="trash" size={18} color="white" style={{ color: "red", borderRadius: 0, padding: 5 }} />
                                        </TouchableOpacity>
                                    </View>
                                )
                            }}
                        />
                    </View>
                    <View>
                        <View style={{ flexDirection: "row-reverse", marginTop: 20 }}>
                            <Button mode="contained" style={{ flex: 0.5 }}
                                onPress={async () => {
                                    let list = [];
                                    expList.map((item) => {
                                        list.push(item.date + "@@" + item.qty);
                                    })
                                    list = list.join("$$");
                                    await Commons.setExpiryList(selectedItem.ID, list, selectedItem.DESC, selectedCategory.ID, selectedTask.ID);
                                    setInitialExpList([]);
                                    setExpList([]);
                                    setShowExpiryModal(false);
                                }}
                            >
                                <Text style={styles.text}> {i18n.t("confirm")} </Text>
                            </Button>
                            <Button mode="contained" style={{ flex: 0.5, marginRight: 5 }} onPress={async () => {
                                setShowExpiryModal(false);
                            }}>
                                <Text style={styles.text}>{i18n.t("back")}</Text>
                            </Button>
                        </View>
                    </View>
                </View>

            </Modal >
        );
    }

    //** Flyer/Offshelf Modal **
    const renderFlyerModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={async () => {
                    await stopCategoryTimer();
                    await stopTaskTimer();
                    setShowFlyerModal(false);
                }}
                contentContainerStyle={[styles.modalStyle]}
            >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Constants.appColor, padding: 15, width: "100%" }}>
                    <Text style={{ fontSize: 18, color: "white", fontWeight: "bold" }}>
                        {selectedTask.DESC}
                        {(selectedTask.IS_OPTIONAL === "1" || selectedTask.IS_OPTIONAL === "true") && (
                            <Text style={{ fontSize: 14, fontWeight: "normal" }}> (Optional)</Text>
                        )}
                    </Text>
                    {selectedTask.IS_OPTIONAL !== "1" && selectedTask.IS_OPTIONAL !== "true" && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 14, color: "white", marginRight: 10 }}>
                                {i18n.t("category")}: {formatTime(categoryTimeSpent)}
                            </Text>
                            <Text style={{ fontSize: 14, color: "white", fontWeight: "bold" }}>
                                {i18n.t("task")}: {formatTime(taskTimeSpent)}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={{ padding: 20 }}>
                    <Button mode="contained" style={{ backgroundColor: Constants.darkBlueColor }}
                        onPress={() => {
                            setShowCaptureModalFlyer(true);
                        }}>
                        <View style={{ flexDirection: 'row' }}>
                            <Ionicons name="camera" size={24} color={White} />
                            <Text style={styles.text}>  {i18n.t("takePicture")} </Text>
                        </View>
                    </Button>

                    {flyerAttachment && (
                        <View style={{ marginTop: 20, alignItems: "center" }}>
                            <Image
                                source={{ uri: flyerAttachment }}
                                style={{ width: width * 0.8, height: height * 0.4, resizeMode: "contain" }}
                            />
                            <Button
                                mode="outlined"
                                style={{ marginTop: 10, borderColor: "red" }}
                                onPress={() => {
                                    Commons.confirmAlert(i18n.t("areYouSure"), "", () => {
                                        setFlyerAttachment("");
                                    });
                                }}
                            >
                                <View style={{ flexDirection: 'row' }}>
                                    <Ionicons name="trash" size={20} color="red" />
                                    <Text style={{ color: "red" }}>  {i18n.t("delete")} </Text>
                                </View>
                            </Button>
                        </View>
                    )}

                    <View style={{ flexDirection: "row-reverse", marginTop: 20 }}>
                        <Button mode="contained" style={{ backgroundColor: Constants.appColor, flex: 0.5 }}
                            onPress={async () => {
                                if (selectedTask.TYPE == "Flyer") {
                                    await Commons.setFlyerAttachment(selectedCategory.ID, selectedTask.ID, flyerAttachment, selectedTask.DESC, selectedTask.TYPE);
                                } else if (selectedTask.TYPE == "Offshelf") {
                                    await Commons.setOffshelfAttachment(selectedCategory.ID, selectedTask.ID, flyerAttachment, selectedTask.DESC, selectedTask.TYPE);
                                }
                                await stopCategoryTimer();
                                await stopTaskTimer();
                                setShowFlyerModal(false);
                            }}
                        >
                            <Text style={styles.text}> {i18n.t("confirm")} </Text>
                        </Button>
                        <Button mode="contained" style={{ flex: 0.5, marginRight: 5 }} onPress={async () => {
                            await stopCategoryTimer();
                            await stopTaskTimer();
                            setShowFlyerModal(false);
                        }}>
                            <Text style={styles.text}>{i18n.t("back")}</Text>
                        </Button>
                    </View>
                </View>
            </Modal >
        );
    }

    //** Category Item Modal **
    const renderCatItemsModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={async () => {
                    await stopCategoryTimer();
                    await stopTaskTimer();
                    setShowCatItemsModal(false);
                    setSearchTextCatItems("");
                }}
                contentContainerStyle={[styles.modalStyle, { height: "80%" }]}
            >
                <TextInput
                    placeholder={i18n.t("search")}
                    clearButtonMode="always"
                    style={styles.searchBox}
                    value={searchTextCatItems}
                    onChangeText={(text) => {
                        setSearchTextCatItems(text);
                        const list = Commons.handleSearch(text, categoryItemsList);
                        setFilteredCatItemsList(list);
                    }}
                />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Constants.appColor, padding: 15, width: "100%" }}>
                    <Text style={{ fontSize: 18, color: "white", fontWeight: "bold" }}>
                        {selectedCategory.DESC} - {selectedTask.DESC}
                        {(selectedTask.IS_OPTIONAL === "1" || selectedTask.IS_OPTIONAL === "true") && (
                            <Text style={{ fontSize: 14, fontWeight: "normal" }}> (Optional)</Text>
                        )}
                    </Text>
                    {selectedTask.IS_OPTIONAL !== "1" && selectedTask.IS_OPTIONAL !== "true" && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontSize: 14, color: "white", marginRight: 10 }}>
                                {i18n.t("category")}: {formatTime(categoryTimeSpent)}
                            </Text>
                            <Text style={{ fontSize: 14, color: "white", fontWeight: "bold" }}>
                                {i18n.t("task")}: {formatTime(taskTimeSpent)}
                            </Text>
                        </View>
                    )}
                </View>
                <FlatList
                    keyExtractor={(item) => selectedCategory + selectedTask + item.ID}
                    data={filteredCatItemsList}
                    extraData={filteredCatItemsList}
                    renderItem={renderCategoryItem}
                />
                <Button mode="contained" style={{ borderRadius: 0, marginRight: 5 }} onPress={async () => {
                    await stopCategoryTimer();
                    await stopTaskTimer();
                    setShowCatItemsModal(false);
                }}>
                    <Text style={styles.text}>{i18n.t("back")}</Text>
                </Button>
            </Modal>
        )
    }

    //** Select Task Modal **
    const renderSelectTaskModal = () => {
        return (
            <Modal
                visible={true}
                onDismiss={() => {
                    setShowSelectTaskModal(false);
                    setSearchTextTask("");
                }}
                contentContainerStyle={[styles.modalStyle, { height: "95%" }]}
            >
                <TextInput
                    placeholder={i18n.t("search")}
                    clearButtonMode="always"
                    style={styles.searchBox}
                    value={searchTextTask}
                    onChangeText={(text) => {
                        setSearchTextTask(text);
                        const list = Commons.handleSearch(text, tasksList);
                        setFilteredTasksList(list);
                    }}
                />
                <Text style={{ textAlign: "center", fontSize: 18, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 15, width: "100%" }}>
                    {i18n.t("tasks")}
                </Text>
                <FlatList
                    keyExtractor={(item) => item.ID}
                    data={filteredTasksList}
                    extraData={filteredTasksList}
                    renderItem={renderTaskItem}
                />
                <Button mode="contained" style={{ borderRadius: 0, marginRight: 5 }} onPress={async () => {
                    setShowSelectTaskModal(false);
                }}>
                    <Text style={styles.text}>{i18n.t("back")}</Text>
                </Button>
            </Modal>
        )
    }

    const updateTaskItemAvlList = (id, itemAvl) => {
        let catList = [...categoryItemsList];
        let index = catList.findIndex(el => el.ID == id)
        catList[index] = { ...catList[index], ITEM_AVAILABLE: itemAvl }
        setCategoryItemsList(catList);
        setFilteredCatItemsList(catList);
    }

    const renderCategoryItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={[styles.card, { alignItems: "center" }]}
                onPress={async () => {
                    handleCategoryItemSelect(item)
                }}
            >
                <Text style={{ color: "red", marginBottom: 15 }}>
                    {item.ID}
                </Text>
                <Text>{item.DESC}</Text>
                {selectedTask.TYPE == "Item Availability" && (
                    <View style={{ padding: 20 }}>
                        <RadioGroup
                            radioButtons={radioButtonsAvl}
                            onPress={async (val) => {
                                if (val != "") {
                                    console.log(val);
                                    await Commons.setTaskItemAvl(item.ID, val, item.DESC, selectedTask.ID, selectedCategory.ID);
                                    updateTaskItemAvlList(item.ID, val);
                                }
                            }}
                            selectedId={item.ITEM_AVAILABLE}
                            containerStyle={{
                                alignItems: "flex-start",
                                width: "100%",
                                padding: 5,
                            }}
                            labelStyle={{
                                fontSize: 16,
                            }}
                        />
                        {/* <Button mode="contained" style={{ backgroundColor: Constants.appColor, borderRadius: 0, marginTop: 20, marginHorizontal: 70 }}
                            onPress={async () => {
                                if (itemAvailable != "") {
                                    console.log(item.ID);
                                    await Commons.setTaskItemAvl(item.ID, itemAvailable, selectedItem.DESC, selectedTask.ID, selectedCategory.ID);
                                    setShowItemAvlModal(false);
                                    setItemAvailable("");
                                }
                            }}>
                            <Text style={styles.text}> {i18n.t("confirm")} </Text>
                        </Button> */}

                    </View>
                )}
            </TouchableOpacity>
        )
    }

    const renderTaskItem = ({ item }) => {
        return (
            <View>
                <TouchableOpacity
                    onPress={() => {
                        if (inTime != "") {
                            setSelectedTask(item);
                            handleTaskSelection(item);
                        } else {
                            Commons.okAlert(i18n.t("visitNotStarted"))
                        }
                    }}
                >
                    <View
                        style={{
                            padding: 15,
                            marginBottom: 10,
                            backgroundColor: Color.GREY[50],
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: Color.GREY[500],
                        }}
                    >
                        <Text style={{ marginRight: 20, color: "red", alignSelf: "center", marginBottom: 15 }}>
                            {item.ID}
                            {(item.IS_OPTIONAL === "1" || item.IS_OPTIONAL === "true") && (
                                <Text style={{ color: "gray", fontSize: 12 }}> (Optional)</Text>
                            )}
                        </Text>
                        <View style={styles.taskItemView(curLang)}>
                            <Text>{" "}{i18n.t("type")}{" "}</Text>
                            <Text>{item.TYPE}</Text>
                        </View>
                        <View style={styles.taskItemView(curLang)}>
                            <Text>{" "}{i18n.t("desc")}{" "}</Text>
                            <Text>{item.DESC}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    const renderCategory = ({ item }) => {
        return (
            <TouchableOpacity
                style={[styles.card, { alignItems: "center", opacity: passwordOverrideMode ? 0.5 : 1 }]}
                disabled={passwordOverrideMode}
                onPress={async () => {
                    if (passwordOverrideMode) {
                        Commons.okAlert(i18n.t("restrictedMode"));
                        return;
                    }
                    setProggressDialogVisible(true);
                    setProgressDialogMessage(i18n.t("loadingTasks"));
                    const user = await Commons.getFromAS("userID");
                    const tasks = await Commons.getTasksDB(user, selectedCustomer, item.ID);

                    // Filter tasks based on current date within FDT and TDT range
                    const currentDate = moment();
                    const validTasks = tasks.filter(task => {
                        if (!task.FDT || !task.TDT) return true; // Include tasks without dates
                        const fromDate = moment(task.FDT, 'DD/MM/YYYY');
                        const toDate = moment(task.TDT, 'DD/MM/YYYY');
                        return currentDate.isSameOrAfter(fromDate, 'day') && currentDate.isSameOrBefore(toDate, 'day');
                    });

                    if (validTasks.length > 0) {
                        setTasksList(validTasks);
                        setFilteredTasksList(validTasks);
                        setSelectedCategory(item);
                        setShowSelectTaskModal(true);
                        if (validTasks[0].VISIT_ID == undefined) {
                            await Commons.addTasksToVisit(validTasks);
                        };
                    } else {
                        Commons.okAlert(i18n.t("noTasksFound"));
                    }
                    setProggressDialogVisible(false);
                }}
            >
                <Text style={{ color: "red", marginBottom: 15 }}>
                    {item.ID}
                </Text>
                <Text>{item.DESC}</Text>
                {passwordOverrideMode && (
                    <Ionicons name="lock-closed" size={20} color="red" style={{ position: "absolute", top: 10, right: 10 }} />
                )}
            </TouchableOpacity>
        )
    }

    const saveVisit = async (inTime, outTime, status) => {
        const curUser = await Commons.getFromAS("userID");
        const curVisID = await Commons.getFromAS("curVisitID");
        console.log(inTime);
        console.log(outTime);
        await Commons.addToVisitSummary(curVisID, curUser, selectedCustomer, inTime, outTime, notes, status);
    }

    const handleSaveChanges = async () => {
        setProggressDialogVisible(true);
        setProgressDialogMessage(i18n.t("savingChanges"));

        // Save locally without setting end time - status remains "pending"
        await saveVisit(inTime, "", "pending");

        // Try to post to API, but don't fail if it doesn't work
        try {
            const curVisID = await Commons.getFromAS("curVisitID");

            // Upload all attachments before posting
            setProgressDialogMessage(i18n.t("uploadingAttachments"));
            const tasksData = await Commons.getVisitDataForPost(curVisID);

            setProgressDialogMessage(i18n.t("postingData"));
            const tasksJson = JSON.stringify(tasksData);
            const user = await Commons.getFromAS("userID");
            const result = await ServerOperations.postVisit(
                curVisID,
                selectedCustomer,
                inTime,
                "",
                notes,
                "N", // Not posted (just saving)
                user,
                tasksJson
            );
            console.log("tasksData:", tasksJson);

            if (result && result.success) {
                Commons.okAlert(i18n.t("changesSaved"));
            } else {
                Commons.okAlert(i18n.t("changesSavedNotPosted"));
            }
        } catch (error) {
            console.error("API post failed:", error);
            Commons.okAlert(i18n.t("changesSavedNotPosted"));
        }

        setProggressDialogVisible(false);
    }

    const handleEndAndPost = async () => {
        setProggressDialogVisible(true);
        const time = moment().format('DD/MM/YYYY, h:mm');

        // Check distance first (skip if in password override mode)
        if (!passwordOverrideMode) {
            setProgressDialogMessage(i18n.t("checkingDistance"));
            await checkDistance(selectedCustomerLocation, allowedRadius);
        }

        // Save locally with "posted" status and set end time
        setProgressDialogMessage(i18n.t("endingVisit"));
        setOutTime(time);
        await saveVisit(inTime, time, "posted");

        // Must post to API - required for ending visit
        try {
            const curVisID = await Commons.getFromAS("curVisitID");

            // Upload all attachments before posting
            setProgressDialogMessage(i18n.t("uploadingAttachments"));
            const tasksData = await Commons.getVisitDataForPost(curVisID);

            setProgressDialogMessage(i18n.t("postingData"));
            const tasksJson = JSON.stringify(tasksData);
            const user = await Commons.getFromAS("userID");
            const result = await ServerOperations.postVisit(
                curVisID,
                selectedCustomer,
                inTime,
                time,
                notes,
                "Y", // Posted (ending visit)
                user,
                tasksJson,
            );

            if (!result || !result.success) {
                Commons.okAlert(i18n.t("networkErrorVisitNotEnded"));
                // Revert outTime since we couldn't post
                setOutTime("");
                return;
            }

            setProggressDialogVisible(false);
            Commons.okAlert(i18n.t("visitEnded"));
            // Optionally navigate away or disable further editing
        } catch (error) {
            setProggressDialogVisible(false);
            console.error("Failed to post visit:", error);
            Commons.okAlert(i18n.t("networkErrorVisitNotEnded"));
            // Revert outTime since we couldn't post
            setOutTime("");
        }
    }

    const saveLocation = async () => {
        const locationData = await getCurrentLocation();
        if (locationData) {
            const { location: curLocation } = locationData;
            await Commons.updateCustomerLocationDB(selectedCustomer, curLocation);
            setSelectedCustomerLocation(curLocation);
        }
    }

    return (
        <SafeAreaView style={styles.cardContainer}>
            <ProgressDialog visible={progressDialogVisible} label={progressDialogMessage} />
            <Portal>{!!showSelectTaskModal && renderSelectTaskModal()}</Portal>
            <Portal>{!!showCatItemsModal && renderCatItemsModal()}</Portal>
            <Portal>{!!showItemAvlModal && renderItemAvlModal()}</Portal>
            <Portal>{!!showCaptureModal && renderCaptureModal()}</Portal>
            <Portal>{!!showImageTypeModal && renderImageTypeModal()}</Portal>
            <Portal>{!!showFacesModal && renderFacesModal()}</Portal>
            <Portal>{!!showPricingModal && renderPricingModal()}</Portal>
            <Portal>{!!showExpiryModal && renderExpiryModal()}</Portal>
            <Portal>{!!showFlyerModal && renderFlyerModal()}</Portal>
            <Portal>{!!showCaptureModalFlyer && renderCaptureModalFlyer()}</Portal>
            <Portal>{!!showAddToCompListModal && renderAddToCompListModal()}</Portal>
            <Portal>{!!showAddToExpListModal && renderAddToExpListModal()}</Portal>
            <Portal>{!!showCaptureModalPricing && renderCaptureModalPricing()}</Portal>
            <Portal>{!!merchPassModalVisible && renderMerchPassModal()}</Portal>
            <Portal>
                {renderDatePickerModal}
            </Portal>
            <View style={{ backgroundColor: Constants.appColor, padding: 10, width: "100%" }}>
                <Text style={{ color: "white", fontWeight: "bold", textAlign: "center", fontSize: 18 }}>{route.params.visitID}</Text>
                {selectedCustomer != "" && (
                    <Text style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "bold",
                        marginTop: 10,
                        textAlign: "center"
                    }}>
                        {selectedCustomer} - {selectedCustomerName}
                    </Text>
                )}
                <View
                    style={{
                        borderBottomColor: 'gray',
                        borderBottomWidth: StyleSheet.hairlineWidth,
                    }}
                />
                {inTime != "" && (<Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>{i18n.t("inTime")} {" "} {inTime}  </Text>)}
                {outTime != "" && <Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>{i18n.t("outTime")} {" "} {outTime}  </Text>}
            </View>
            <TextInput
                placeholder={i18n.t("search")}
                clearButtonMode="always"
                style={styles.searchBox}
                value={searchText}
                onChangeText={(text) => {
                    setSearchText(text);
                    const list = Commons.handleSearch(text, categoriesList);
                    setFilteredCategoriesList(list);
                }}
            />
            <Text style={{ textAlign: "center", fontSize: 18, backgroundColor: Constants.appColor, color: "white", fontWeight: "bold", padding: 10, width: "100%" }}>
                {i18n.t("categories")}
            </Text>
            <FlatList
                keyExtractor={(item) => item.ID}
                data={filteredCategoriesList}
                extraData={filteredCategoriesList}
                renderItem={renderCategory}
            />
            <View>

                {/* {outTime == "" && (<View style={{ flexDirection: "row" }}>
                    <Button mode="contained" style={{ flex: 0.5, borderRadius: 0, marginRight: 5 }} onPress={async () => {
                        if (outTime == "") {
                            saveVisit(inTime, outTime, "pending");
                            Commons.okAlert(i18n.t("changesSaved"));
                        } else {
                            Commons.okAlert(i18n.t("cantSaveVisitEnded"));
                        }
                    }}>
                        <Text style={styles.text}>{i18n.t("save")}</Text>
                    </Button>
                    <Button mode="contained" style={{ flex: 0.5, borderRadius: 0 }} onPress={async () => {
                        const time = moment().format('DD/MM/YYYY, h:mm');
                        checkDistance(selectedCustomerLocation);
                        setOutTime(time);
                        sendVisit(inTime, time);
                        Commons.okAlert(i18n.t("visitEnded"), i18n.t("changesSaved"));
                    }}>
                        <Text style={styles.text}>{i18n.t("send")}</Text>
                    </Button>
                </View>)} */}
            </View>
            <TextInput
                label={i18n.t("notes")}
                value={notes}
                onChangeText={setNotes}
                style={{ backgroundColor: "#ececec", padding: 10, marginBottom: 5 }}
            />
            {
                (inTime == "" && outTime == "") && (<Button mode="contained" style={{ marginVertical: 5, marginBottom: 20, backgroundColor: "green" }}
                    onPress={async () => {
                        setProggressDialogVisible(true);
                        setProgressDialogMessage(i18n.t("checkingForUpdates"));

                        // Check if this is the first visit of the day
                        const user = await Commons.getFromAS("userID");
                        const hasVisitsToday = await Commons.hasVisitsToday(user);

                        if (!hasVisitsToday) {
                            // First visit of the day - update data from server
                            setProgressDialogMessage(i18n.t("updatingData"));
                            try {
                                const cats = await ServerOperations.getCategories();
                                await Commons.loadCategories(cats);
                                const customers = await ServerOperations.getCustomers();
                                await Commons.loadCustomers(customers);
                                const visitPasses = await ServerOperations.getVisitPasswords();
                                await Commons.loadVisitPasswords(visitPasses);
                                const merchUsers = await ServerOperations.getMerchUsers();
                                await Commons.loadMerchUsers(merchUsers);
                                const tasks = await ServerOperations.getTasks(user);
                                const items = await ServerOperations.getCategoryItems();
                                await Commons.loadItems(items);
                                await Commons.loadTasks(tasks);
                            } catch (error) {
                                console.error("Error updating data:", error);
                                // Continue anyway - don't block visit start
                            }
                        }

                        setProgressDialogMessage(i18n.t("startingVisit"));
                        const time = moment().format('DD/MM/YYYY, h:mm');
                        setInTime(time);
                        await saveVisit(time, outTime, "pending");
                        setProggressDialogVisible(false);
                    }}>
                    <Text style={styles.text}>{i18n.t("startVisit")}</Text>
                </Button>)
            }
            {
                (outTime == "" && inTime != "") && (
                    <View style={{ flexDirection: "row", marginVertical: 5, marginBottom: 20 }}>
                        {!passwordOverrideMode && (
                            <Button
                                mode="contained"
                                icon={({ size }) => <Ionicons name="save" size={size} color="white" />}
                                buttonColor={Constants.appColor}
                                textColor="white"
                                style={{ flex: 1, marginRight: 5 }}
                                onPress={handleSaveChanges}
                            >
                                <Text style={{ color: "white" }}>{i18n.t("saveChanges")}</Text>
                            </Button>
                        )}
                        <Button
                            mode="contained"
                            icon={({ size }) => <Ionicons name="checkmark-circle" size={size} color="white" />}
                            style={{ flex: passwordOverrideMode ? 1 : 1, marginLeft: passwordOverrideMode ? 0 : 5, backgroundColor: "red" }}
                            onPress={handleEndAndPost}
                        >
                            <Text style={{ color: "white" }}>{i18n.t("endAndPost")}</Text>
                        </Button>
                    </View>
                )
            }
            {passwordOverrideMode && (
                <View style={{ backgroundColor: "#fff3cd", padding: 10, marginVertical: 10, borderRadius: 5, borderWidth: 1, borderColor: "#ffc107" }}>
                    <Text style={{ color: "#856404", textAlign: "center", fontWeight: "bold" }}>
                        {i18n.t("restrictedModeMessage")}
                    </Text>
                </View>
            )}
        </SafeAreaView >
    );
};
const styles = StyleSheet.create({
    viewContainer: {
        width: "80%",
        marginTop: 80,
    },
    addButtonStyle: { color: "white" },
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
        padding: 15
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
        backgroundColor: "#FF0000",
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    cardTitle: {
        color: "#A91B0D",
    },
    appButtonText: {
        fontSize: 16,
        color: "#fff",
        fontWeight: "bold",
        alignSelf: "center",
        textTransform: "uppercase",
    },
    searchBox: {
        borderColor: "#ccc",
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 8,
        textAlign: "center",
        backgroundColor: "#ececec"
    },
    card: {
        alignItems: "flex-start",
        marginBottom: 12,
        backgroundColor: Color.GREY[50],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Color.GREY[500],
        padding: 15
    }
});
