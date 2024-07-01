import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Braze from '@braze/react-native-sdk';

export const CustomIAM = () => {
  const [IAMHtml, setIAMHtml] = useState<string | null>(null);

  Braze.subscribeToInAppMessage(false, event => {
    const html = JSON.parse(event.inAppMessage as unknown as string);
    setIAMHtml(html);
    console.log('!@# CUSTOM IAM OPENED');
  });

  if (!IAMHtml) {
    return null;
  }

  return (
    <View style={styles.customIAMWrapper}>
      <Text style={styles.title}>Test IAM Wrapper</Text>
      <WebView
        source={{ html: IAMHtml.message }}
        injectedJavaScript={communicationLayerScript}
        onMessage={event => {
          const parsedData = JSON.parse(event.nativeEvent.data);
          const { topic, data } = parsedData;

          if (topic === 'telemetry:user-engagement:close-in-app-message') {
            setIAMHtml(null);
            console.log('!@# CUSTOM IAM CLOSED');
          }
        }}
      />
    </View>
  );
};

// Because we "stole" the rendering from the native side we need to inject the script that will allow us to communicate with the webview content
// Is there a better way to do this? How is the native Braze SDK handling that?
const communicationLayerScript = `
  const sendWebViewMessage = (topic, data) => {
    const message = JSON.stringify({ topic, data: data || {} });
    window.ReactNativeWebView?.postMessage(message);
  };
  
  if (!window.appboyBridge) {
    window.appboyBridge = {
      closeMessage: () => sendWebViewMessage("telemetry:user-engagement:close-in-app-message"),
      logCustomEvent: (event) => sendWebViewMessage("telemetry:analytics:track-event", event),
      logClick: (event) => sendWebViewMessage("telemetry:user-engagement:log-in-app-message-click", event),
      requestImmediateDataFlush: () => sendWebViewMessage("telemetry:user-engagement:flush-data-immediately"),
      // need to implement getUser as a method that returns an object with the following methods to satisfy Braze.appboyBride API
    };
  }
  true;
`;

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
  },
  customIAMWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '50%',
    width: '100%',
    backgroundColor: 'tomato',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
