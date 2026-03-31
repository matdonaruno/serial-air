export const Alert = {
  alert: jest.fn(),
};
export const StyleSheet = {
  create: (styles: any) => styles,
  hairlineWidth: 1,
  absoluteFillObject: {},
};
export const Platform = { OS: 'ios' };
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const ScrollView = 'ScrollView';
export const Switch = 'Switch';
export const FlatList = 'FlatList';
export const Keyboard = { dismiss: jest.fn() };
export const Linking = { openURL: jest.fn() };
export const SafeAreaView = 'SafeAreaView';
export const KeyboardAvoidingView = 'KeyboardAvoidingView';
export const useWindowDimensions = () => ({ width: 375, height: 812 });
