/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @providesModule UIExplorerApp
 * @flow
 */
'use strict';

const React = require('React');
const ReactNative = require('react-native-macos');
const {
  AppRegistry,
  BackAndroid,
  Dimensions,
  DrawerLayoutAndroid,
  NavigationExperimental,
  StyleSheet,
  ToolbarAndroid,
  View,
  StatusBar,
} = ReactNative;
const {
  RootContainer: NavigationRootContainer,
} = NavigationExperimental;
const UIExplorerExampleList = require('./UIExplorerExampleList');
const UIExplorerList = require('./UIExplorerList');
const UIExplorerNavigationReducer = require('./UIExplorerNavigationReducer');
const UIExplorerStateTitleMap = require('./UIExplorerStateTitleMap');
const UIManager = require('UIManager');
const URIActionMap = require('./URIActionMap');

UIManager.setLayoutAnimationEnabledExperimental(true);

const DRAWER_WIDTH_LEFT = 56;

type Props = {
  exampleFromAppetizeParams: string,
};

type State = {
  initialExampleUri: ?string,
};

class UIExplorerApp extends React.Component {
  _handleOpenInitialExample: Function;
  state: State;
  constructor(props: Props) {
    super(props);
    this._handleOpenInitialExample = this._handleOpenInitialExample.bind(this);
    this.state = {
      initialExampleUri: props.exampleFromAppetizeParams,
    };
  }

  componentWillMount() {
    BackAndroid.addEventListener('hardwareBackPress', this._handleBackButtonPress.bind(this));
  }

  componentDidMount() {
    // There's a race condition if we try to navigate to the specified example
    // from the initial props at the same time the navigation logic is setting
    // up the initial navigation state. This hack adds a delay to avoid this
    // scenario. So after the initial example list is shown, we then transition
    // to the initial example.
    setTimeout(this._handleOpenInitialExample, 500);
  }

  render() {
    return (
      <NavigationRootContainer
        persistenceKey="UIExplorerStateNavState"
        ref={navRootRef => { this._navigationRootRef = navRootRef; }}
        reducer={UIExplorerNavigationReducer}
        renderNavigation={this._renderApp.bind(this)}
        linkingActionMap={URIActionMap}
      />
    );
  }

  _handleOpenInitialExample() {
    if (this.state.initialExampleUri) {
      const exampleAction = URIActionMap(this.state.initialExampleUri);
      if (exampleAction && this._navigationRootRef) {
        this._navigationRootRef.handleNavigation(exampleAction);
      }
    }
    this.setState({initialExampleUri: null});
  }

  _renderApp(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <DrawerLayoutAndroid
        drawerPosition={DrawerLayoutAndroid.positions.Left}
        drawerWidth={Dimensions.get('window').width - DRAWER_WIDTH_LEFT}
        keyboardDismissMode="on-drag"
        onDrawerOpen={() => {
          this._overrideBackPressForDrawerLayout = true;
        }}
        onDrawerClose={() => {
          this._overrideBackPressForDrawerLayout = false;
        }}
        ref={(drawer) => { this.drawer = drawer; }}
        renderNavigationView={this._renderDrawerContent.bind(this, onNavigate)}
        statusBarBackgroundColor="#589c90">
        {this._renderNavigation(navigationState, onNavigate)}
      </DrawerLayoutAndroid>
    );
  }

  _renderDrawerContent(onNavigate) {
    return (
      <View style={styles.drawerContentWrapper}>
        <UIExplorerExampleList
          list={UIExplorerList}
          displayTitleRow={true}
          disableSearch={true}
          onNavigate={(action) => {
            this.drawer && this.drawer.closeDrawer();
            onNavigate(action);
          }}
        />
      </View>
    );
  }

  _renderNavigation(navigationState, onNavigate) {
    if (navigationState.externalExample) {
      var Component = UIExplorerList.Modules[navigationState.externalExample];
      return (
        <Component
          onExampleExit={() => {
            onNavigate(NavigationRootContainer.getBackAction());
          }}
          ref={(example) => { this._exampleRef = example; }}
        />
      );
    }

    const {stack} = navigationState;
    const title = UIExplorerStateTitleMap(stack.routes[stack.index]);
    const index = stack.routes.length <= 1 ?  1 : stack.index;

    if (stack && stack.routes[index]) {
      const {key} = stack.routes[index];
      const ExampleModule = UIExplorerList.Modules[key];
      const ExampleComponent = UIExplorerExampleList.makeRenderable(ExampleModule);
      return (
        <View style={styles.container}>
          <ToolbarAndroid
            logo={require('image!launcher_icon')}
            navIcon={require('image!ic_menu_black_24dp')}
            onIconClicked={() => this.drawer.openDrawer()}
            style={styles.toolbar}
            title={title}
          />
          <ExampleComponent
            ref={(example) => { this._exampleRef = example; }}
          />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <ToolbarAndroid
          logo={require('image!launcher_icon')}
          navIcon={require('image!ic_menu_black_24dp')}
          onIconClicked={() => this.drawer.openDrawer()}
          style={styles.toolbar}
          title={title}
        />
        <UIExplorerExampleList
          list={UIExplorerList}
          {...stack.routes[0]}
        />
      </View>
    );
  }

  _handleBackButtonPress() {
    if (this._overrideBackPressForDrawerLayout) {
      // This hack is necessary because drawer layout provides an imperative API
      // with open and close methods. This code would be cleaner if the drawer
      // layout provided an `isOpen` prop and allowed us to pass a `onDrawerClose` handler.
      this.drawer && this.drawer.closeDrawer();
      return true;
    }
    if (
      this._exampleRef &&
      this._exampleRef.handleBackAction &&
      this._exampleRef.handleBackAction()
    ) {
      return true;
    }
    if (this._navigationRootRef) {
      return this._navigationRootRef.handleNavigation(
        NavigationRootContainer.getBackAction()
      );
    }
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    backgroundColor: '#E9EAED',
    height: 56,
  },
  drawerContentWrapper: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: 'white',
  },
});

AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);

module.exports = UIExplorerApp;
