interface Config {
  email: {
    user: string;
    appPassword: string;
  };
  // Add other configuration sections as needed
}

export const config: Config = {
  email: {
    user: process.env.GMAIL_USER || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || '',
  },
}; 