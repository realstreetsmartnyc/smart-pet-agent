import type { ConfigPlugin, Config } from 'expo/config';
import { withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

const FIREBASE_IMPORT = 'import FirebaseCore';
const FIREBASE_CONFIGURE = 'FirebaseApp.configure()';

const withFirebaseInit: ConfigPlugin = (config: Config) => {
  return withDangerousMod(config, [
    'withFirebaseInit',
    (config: Config) => {
      try {
        const projectName = (config.ios as any)?.name ?? config.name ?? 'SmartPetAgent';
        const iosProjectRoot = config.modRequest?.platformProjectRoot ?? path.join('ios', projectName);
        const appDelegatePath = path.join(iosProjectRoot, 'AppDelegate.swift');

        if (fs.existsSync(appDelegatePath)) {
          let content = fs.readFileSync(appDelegatePath, 'utf8');

          if (!content.includes(FIREBASE_IMPORT)) {
            content = content.replace(
              /import UIKit\n/,
              `import UIKit\n${FIREBASE_IMPORT}\n`
            );
          }

          if (!content.includes(FIREBASE_CONFIGURE)) {
            content = content.replace(
              /(func application\(_ application: UIApplication,\n\s*didFinishLaunchingWithOptions launchOptions:\n\s*\[UIApplication\.LaunchOptionsKey: Any\]\?\) -> Bool \{\n)/,
              `$1    ${FIREBASE_CONFIGURE}\n`
            );
          }

          fs.writeFileSync(appDelegatePath, content);
        }
      } catch {
        // Prebuild may not have generated iOS files yet; skip silently
      }

      return config;
    },
  ]);
};

export default withFirebaseInit;
