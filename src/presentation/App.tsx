
import style from './App.module.scss'
import { Route, Routes } from 'react-router-dom'
import { EditorPage } from './pages/editor'
import 'antd/dist/reset.css'


function App() {

  return (
    <div className={style.container}>

      <main className={style.main}>
        <EditorPage />

      </main>

    </div>
  )
}

export default App
