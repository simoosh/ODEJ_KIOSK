// Réglages du CLI Remotion (studio et rendu). Doc : https://www.remotion.dev/docs/config
import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Le titre animé vit dans la borne (APP/odej-kiosk/src/wordmark) : un seul React, celui de ce dossier
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      react: path.resolve('node_modules/react'),
      'react-dom': path.resolve('node_modules/react-dom'),
    },
  },
}));
