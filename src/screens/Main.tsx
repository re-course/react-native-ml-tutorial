import React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  PermissionsAndroid
} from 'react-native';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import ImagePicker from 'react-native-image-picker/src';

import * as ImageService from '../services/ImageService';

const Main = (props: any): React.FunctionComponentElement<any> => {
  const [loading, setLoading] = useState(true);
  const [storagePermissionGranted, setStoragePermission] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [predictionInProgress, setPredictionProgress] = useState(false);

  // next step: connect camera or gallery
  
  const modelRef = useRef();
  const image = useRef();
  const camera = useRef();

  const load = async () => {
    try {
      // check tfjs
      await tf.ready();

      // do other stuff
      modelRef.current = await mobilenet.load();
      setLoading(false);
    } catch (e) {
      console.warn('tfjs is not ready!', e);
    }
  }

  const requestStoragePermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'External storage',
          message: 'App needs access to your gallery',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setStoragePermission(true);
      } else {
        console.warn('Camera permission denied');
      }
    } catch (e) {
      console.warn('request camera permissions failed', e);
    }
  }

  const takePicture = async function (camera: any) {
    const options = {
      title: 'Select Image',
      // customButtons: [{ name: 'fb', title: 'Choose Photo from Facebook' }],
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    setPredictionProgress(true);
    ImagePicker.launchImageLibrary(options, async (response) => {
      if (response) {
        const predictions = await ImageService.classifyImage(modelRef.current, response);
        setPredictions(predictions);
      }
      setPredictionProgress(false);
    });
  };

  useEffect(function instantiate () {
    load();
    requestStoragePermissions();
  }, []);
  
  return (
    <View style={styles.main}>
      { loading
        ? <ActivityIndicator animating={loading} size="large" />
        : <Text>{'TF and model are Ready!'}</Text>
      }

      <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => takePicture(camera)} style={styles.capture}>
          <Text style={{ fontSize: 14 }}>Select image</Text>
        </TouchableOpacity>
      </View>

      { predictionInProgress &&
        <ActivityIndicator animating={predictionInProgress} size="large" />
      }

      <View style={{ flex: 0, alignItems: 'flex-start' }}>
        { predictions && predictions.map((guess: any) => (
          <View key={guess.className}>
            <Text>{guess.className}: </Text><Text>{guess.probability.toFixed(3)}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default Main;

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
});
