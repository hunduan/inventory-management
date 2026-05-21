import { Component, PropsWithChildren } from 'react'
import './app.less'

class App extends Component<PropsWithChildren> {
  render() {
    return this.props.children
  }
}

export default App
