// App settings
module.exports = {
  port: 3000,

  // The only person who can log in to the Stock Management page.
  // Other team members have their own components and their own logins.
  // To change the password, run:  npm run set-password -- YourNewPassword
  owner: {
    username: 'bibek',
    displayName: 'Bibek (Stock Manager)',
    passwordHash: '2b1461b383c0fea0ef1f0c322897572e:0179d13a598f290fb1e2de0832c49e19ce30b3a9e20442f151af7734df0a79ee90c329fe2c62a3e5ab9f4518a653e3b8d645c7477dd138595fd64abbf24e63a3'
  },

  // after this many wrong passwords the login is locked for lockMinutes
  maxLoginAttempts: 5,
  lockMinutes: 5,

  lowStockLevel: 5
};
