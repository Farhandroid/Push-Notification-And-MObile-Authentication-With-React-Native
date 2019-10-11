import React, {Component} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Alert,
  AsyncStorage,
} from 'react-native';
import firebase from 'react-native-firebase';
import { Button } from 'native-base';


const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});



type Props = {};
export default class App extends Component<Props> {


  onLoginOrRegister = () => {
    console.log("Enter onLoginOrRegister");
    //const { phoneNumber } = this.state;
    firebase.auth().signInWithPhoneNumber('+8109067056480')
      .then((confirmResult) => {
        Alert.alert("Message sent");
        console.log("Message sent");
        // This means that the SMS has been sent to the user
        // You need to:
        //   1) Save the `confirmResult` object to use later
        this.setState({ confirmResult });
        //   2) Hide the phone number form
        //   3) Show the verification code form
      })
      .catch((error) => {
        const { code, message } = error;
        Alert.alert('PhoneAuthSend Error : '+message);
        console.log("PhoneAuthSend Error : "+message);
        // For details of error codes, see the docs
        // The message contains the default Firebase string
        // representation of the error
      });
  }

  onVerificationCode = () => {
    const { confirmResult, verificationCode } = this.state;
    confirmResult.confirm('123456')
      .then((user) => {
        Alert.alert('Verified')
        // If you need to do anything with the user, do it here
        // The user will be logged in automatically by the
        // `onAuthStateChanged` listener we set up in App.js earlier
      })
      .catch((error) => {
        const { code, message } = error;
        Alert.alert('CodeVerificationError : '+message);
        console.log('CodeVerificationError : '+message);
        // For details of error codes, see the docs
        // The message contains the default Firebase string
        // representation of the error
      })};

  

  async componentDidMount() {
    this.checkPermission();
    this.createNotificationListeners(); 
    this.readVerificationCodeAutomatically();
  }

  componentWillUnmount() {
    this.notificationListener;
    this.notificationOpenedListener;
    this.readVerificationCodeAutomatically;
  }

  ///This is for autometic code read
  async readVerificationCodeAutomatically(){
    firebase.auth().onAuthStateChanged((user) => {
      if (user)
      {
        Alert.alert("Automatically authenticated");
      } // user is verified and logged in
    });
  }

  //1
  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  //3
  async getToken() {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
      fcmToken = await firebase.messaging().getToken();
      if (fcmToken) {
        // user has a device token
        console.log('fcmToken:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    }
    console.log('fcmToken:', fcmToken);
  }

  //2
  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log('permission rejected');
    }
  }

  async createNotificationListeners() {
    /*
     * Triggered when a particular notification has been received in foreground
     * */
    this.notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        const {title, body} = notification;
        console.log('onNotification:'+ notification.body);

        const localNotification = new firebase.notifications.Notification({
          sound: 'default',
          show_in_foreground: true,
        })
          ///.setSound('sampleaudio.wav')
          .setNotificationId(notification.notificationId)
          .setTitle(notification.title)
          .setBody(notification.body)
          .android.setChannelId('fcm_FirebaseNotifiction_default_channel') // e.g. the id you chose above
          .android.setSmallIcon('@drawable/ic_launcher') // create this icon in Android Studio
          .android.setColor('#000000') // you can set a color here
          .android.setPriority(firebase.notifications.Android.Priority.High);

        firebase
          .notifications()
          .displayNotification(localNotification)
          .catch(err => console.error(err)); 
      });

    const channel = new firebase.notifications.Android.Channel(
      'fcm_FirebaseNotifiction_default_channel',
      'Demo app name',
      firebase.notifications.Android.Importance.High,
    )
      .setDescription('Demo app description')
      ///.setSound('sampleaudio.wav');
    firebase.notifications().android.createChannel(channel);

    /*
     * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
     * */
    this.notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
       
        const {title, body} = notificationOpen.notification;
        console.log('onNotificationOpened:');
        Alert.alert(title, body);
      });

    /*
     * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
     * */
    const notificationOpen = await firebase
      .notifications()
      .getInitialNotification();
    if (notificationOpen) {
      const action = notificationOpen.action;
      const {title, body} = notificationOpen.notification;
      console.log('getInitialNotification: title : '+title);
      Alert.alert(title, body);
    }
    /*
     * Triggered for data only payload in foreground
     * */
    this.messageListener = firebase.messaging().onMessage(message => {
      //process data message
      console.log('JSON.stringify:', JSON.stringify(message));
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Button onPress={this.onLoginOrRegister}>
            <Text>Send Code!</Text>
          </Button>
          <Button onPress={this.onVerificationCode }>
            <Text>Verify me</Text>
          </Button>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
