import fs from 'fs-extra';
import path from 'path';

const src = path.resolve(__dirname, '../src/locales');
const dest = path.resolve(__dirname, '../dist/src/locales');

fs.copy(src, dest)
  .then(() => console.log('Locales copied to dist'))
  .catch(err => console.error('Error copying locales:', err));

const srcNotification = path.resolve(__dirname, '../src/notifcation');
const destNotification = path.resolve(__dirname, '../dist/src/notifcation');

fs.copy(srcNotification, destNotification)
  .then(() => console.log('notifcation copied to dist'))
  .catch(err => console.error('Error copying notifcation:', err));

  

