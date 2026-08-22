# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

```plantuml
@startuml
left to right direction
skinparam backgroundColor #FFFFFF
skinparam linetype polyline
skinparam defaultFontName "Times New Roman"
skinparam state {
  BackgroundColor<<pending>> #FFF3CD
  BorderColor<<pending>> #FFC107
  BackgroundColor<<approved>> #D4EDDA
  BorderColor<<approved>> #28A745
  BackgroundColor<<rejected>> #F8D7DA
  BorderColor<<rejected>> #DC3545
  BackgroundColor<<deleted>> #E2E3E5
  BorderColor<<deleted>> #6C757D
  FontStyle bold
}
skinparam ArrowColor #000000
skinparam ArrowFontSize 12

state "Mới" as Moi <<pending>>
state "Chờ ký duyệt" as ChoKyDuyet <<pending>>
state "Đã ký duyệt" as DaKyDuyet <<approved>>
state "Bị từ chối" as BiTuChoi <<rejected>>
state "Đã xóa" as DaXoa <<deleted>>

[*] --> Moi : Tạo mới (CN-01.03) /\nTạo lại (CN-01.09)
Moi --> ChoKyDuyet : Trình ký (CN-01.06)
ChoKyDuyet --> DaKyDuyet : Đủ chữ ký (CN-01.07)
DaKyDuyet --> [*]

ChoKyDuyet --> BiTuChoi : Có 1 người từ chối,\nkèm lý do (CN-01.07)
BiTuChoi --> ChoKyDuyet : Trình ký lại (CN-01.06)
BiTuChoi --> Moi : Sửa (CN-01.04)

Moi --> DaKyDuyet : Xác nhận đã ký ngoài\nhệ thống (CN-01.08)
BiTuChoi --> DaKyDuyet : Xác nhận đã ký ngoài\nhệ thống (CN-01.08)

Moi --> DaXoa : Xóa (CN-01.05)
BiTuChoi --> DaXoa : Xóa (CN-01.05)
DaXoa --> [*]
@enduml


