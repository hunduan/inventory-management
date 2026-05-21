import { Component, PropsWithChildren } from 'react'
import './app.less'

class App extends Component<PropsWithChildren> {
  componentDidMount() {}

  render() {
    return this.props.children
  }
}

export default App
