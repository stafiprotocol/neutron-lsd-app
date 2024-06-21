# neutron-lsd-app

Neutron LSD App is a user interface where users can stake, unstake and get latest information about the project. As a convention in web3 all API users interact with are directly from the RPC configured in wallet, so the app is a pure DApp.

## Setup Node.js env

1. Fork code on GitHub
2. Install Node.js >=v16
3. Install yarn via npm: npm install --global yarn
4. Enter project root directory then install all dependencies via terminal: yarn
5. Start app by: yarn dev

## Config your app

- Change branding links and text here: `config/appConf/app.json`
- Set your pool address and lsd configs on Testnet here: `config/appConf/dev.json`
- Set your pool address and lsd configs on Mainnet here: `config/appConf/prod.json`

## Customize Theme

You can change color config in `tailwind.config.js`, each color has light & dark versions(i.e text1 & text1Dark).

## Build and deploy

Run `yarn build` or `yarn build:dev` to build your app, the static files will be placed in `out` folder. Upload those files to any static web hosting services you like.

## Other resources

You can find more details here: [lsaas-docs](https://lsaas-docs.stafi.io/docs/develop_cosmos_lsd/app.html)
