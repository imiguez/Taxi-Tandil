type RootStackParamList = {
    Home: undefined;
    UserHomeScreen: undefined;
    // Profile: { userId: string };
    // Feed: { sort: 'latest' | 'top' } | undefined;
};

declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootStackParamList {}
    }
}

export default RootStackParamList;