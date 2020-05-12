import React from 'react';
import nlp from 'compromise'
import { useSpring, animated as a } from 'react-spring'
const ReactMarkdown = require('react-markdown')

const GlobalState = React.createContext()
const GlobalDispatch = React.createContext()

let Line = (props) => {
  const dump = nlp(props.children)
  let words = dump.words().map(word => ({
    text: word.text ? word.text().trim() : "",
    id: word.list[0] ? word.list[0].start : "",
    raw: "",
    tags: word.json() ? word.json()[0].terms[0].tags : []
  }))

  if(words.world) return null
  
  return (
    <>
      {
        words
        .filter(word => word.text !== "")
        .map(word => <Word key={word.id} raw={word.raw} tags={word.tags}>{ word.text }</Word>)
      }
    </>
  )
}

let Word = (props) => {
  let tagString = props.tags ? props.tags.join(" ") : ""

  return (
    <span className={"word " + tagString}>
      <span className="word__content">
        {props.children}
      </span>
      <span>&nbsp;</span>
      <span className="word__hover">
        {tagString}
      </span>
    </span>
  )
}

let Toolbar = (props) => {
  const dispatch = React.useContext(GlobalDispatch)

  return (
    <div id="toolbar">
      <div className={`icon ${props.action}`} onClick={() => {dispatch({type: props.action})}}></div>
    </div>
  )
}

let Editor = (props) => {
  const globalState = React.useContext(GlobalState)

  const styles = useSpring({
    transform: (globalState.rendering && window.innerWidth < 769) ? "translateX(-100%)" : "translateX(0%)"
  })

  return (
    <a.div id="editor" style={styles}>
      <Toolbar action="play" />
      <textarea onChange={props.handleInputChange} value={localStorage.getItem("content") ? localStorage.getItem("content") : "# Hi :)"}></textarea>
    </a.div>
  )
}

let Renderer = (props) => {
  const globalState = React.useContext(GlobalState)

  const styles = useSpring({
    transform: (!globalState.rendering && window.innerWidth < 769) ?  "translateX(100%)" : "translateX(0%)"
  })

  return (
    <a.div id="renderer" style={styles}>
      <Toolbar action="edit" />
      <ReactMarkdown source={props.rawContent} rawSourcePos={true} renderers={{
        text: Line
      }} />
    </a.div>
  )
}

function reducer(state, action){

  switch (action.type) {
    case 'play':
      return {rendering: true}

    case 'edit':
      return {rendering: false}

    default: 
      return state
  }
}

let App = () => {
  const [rawContent, setRawContent] = React.useState(localStorage.getItem("content") ? localStorage.getItem("content") : "# Hi :)")
  // const [corpusData, setCorpusData] = React.useState(nlp(""))

  const [appState, dispatch] = React.useReducer(reducer, {rendering: false})
  
  let handleInputChange = (e) => {
    localStorage.setItem("content", e.target.value)
    setRawContent(e.target.value)
  }

  // React.useEffect(() => {
  //   // get innerText || textContent of #renderer
  //   let renderer =  document.getElementById("renderer")
  //   let plainText = renderer.textContent || renderer.innerText

  //   // set corpusData to nlp() of innerText
  //   const dump = nlp(plainText)
  //   // console.log(dump)
  //   setCorpusData(dump.terms().json())
  // }, [rawContent])
  
  return (
    
    <GlobalDispatch.Provider value={dispatch}>
      <GlobalState.Provider value={appState}>
        <Editor handleInputChange={handleInputChange} />
        <Renderer rawContent={rawContent} />
      </GlobalState.Provider>
    </GlobalDispatch.Provider>
  )
}

export default App;
