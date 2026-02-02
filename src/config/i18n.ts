import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';


i18next.use(Backend).init({
  fallbackLng: 'en',
  preload: ['en', 'hi'],
  backend: {
    loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
  },
  interpolation: {
    escapeValue: false,
  },
  returnObjects: false, // 👈 ensures t() always returns string
  returnNull: false,
  returnEmptyString: false,
});


export const t = (key: string, options?: any, lng?: string): string => {
  const translation = i18next.t(key, { ...options, lng }) as unknown as string;
  

  return translation;
};
