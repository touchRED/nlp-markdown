import React from 'react';
import nlp from 'compromise'
import { useSpring, animated as a } from 'react-spring'
import useMeasure from 'react-use-measure'
const ReactMarkdown = require('react-markdown')

const GlobalState = React.createContext()
const GlobalDispatch = React.createContext()

const allTags = Object.keys(nlp("").world.tags)

const initialContent = "# Concrete Poetry"

let Line = (props) => {
  // const globalState = React.useContext(GlobalState)
  // const dispatch = React.useContext(GlobalDispatch)

  // const words = React.useMemo(() => nlp(props.children).words().map(word => ({
  //   text: word.text ? word.text().trim() : "",
  //   id: word.list[0] ? word.list[0].start : "",
  //   tags: word.json() ? word.json()[0].terms[0].tags : []
  // })), [props.children])

  const words = React.useMemo(() => {
    let dump = nlp(props.children)

    // console.log("dump:", dump)
    
    return dump.words().map(word => ({
    text: word.text ? word.text().trim() : "",
    id: word.list[0] ? word.list[0].start : "",
    tags: word.json() ? word.json()[0].terms[0].tags : []
  }))}, [props.children])

  if(words.world) return null
  
  return (
    <>
      {
        words
        .filter(word => word.text !== "")
        .map(word => <Word key={word.id} tags={word.tags}>{ word.text }</Word>)
      }
    </>
  )
}

let Word = (props) => {
  const globalState = React.useContext(GlobalState)

  let tagString = props.tags ? props.tags.join(" ") : ""

  let activeColors = props.tags.filter(tag => {
    return tag in globalState.colors
  }).map(tag => {
    return globalState.colors[tag]
  })

  return (
    <span className="word" style={{"--highlight": activeColors[0]}}>
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
      {props.actions.map(action => (
        <div className={`icon ${action}`} key={action} onClick={() => {dispatch({type: action})}}></div>
      ))}
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
      <Toolbar actions={["play"]} />
      <textarea onChange={props.handleInputChange} value={localStorage.getItem("content") ? localStorage.getItem("content") : initialContent}></textarea>
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
      <Toolbar actions={["edit", "toggleSettings"]} />
      <Settings />
      <ReactMarkdown source={props.rawContent} renderers={{
        text: Line
      }} />
    </a.div>
  )
}

let Settings = (props) => {
  const globalState = React.useContext(GlobalState)
  const dispatch = React.useContext(GlobalDispatch)
  const [selectedTag, setSelectedTag] = React.useState(null)
  const [selectedColor, setSelectedColor] = React.useState("#ffffff")
  const [ref, bounds] = useMeasure()

  const styles = useSpring({
    height: globalState.settingsOpen ? bounds.height : 0
  })

  const handleAddTerm = (e) => {
    dispatch({
      type: "addTerm", 
      payload: {
        term: selectedTag,
        hex: selectedColor
      }
    })
  }

  return (
    <a.div id="settings" className="settings" style={styles}>
      <div ref={ref}>
        <div className="settings__item">
          <select onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">None</option>
            {allTags.map((tag, i) => (
              <option value={tag} key={tag + i}>{tag}</option>
            ))}
          </select>
          <input type="color" onChange={e => setSelectedColor(e.currentTarget.value)} defaultValue="#ffffff"></input>
          <button onClick={handleAddTerm}>Add Color</button>
        </div>
        <div className="settings__grid">
          {Object.keys(globalState.colors).map((color, i) => (
            <SettingsItem term={color} color={globalState.colors[color]} key={color + i} />
          ))}
        </div>
      </div>
    </a.div>
  )
}

let SettingsItem = (props) => {
  const globalState = React.useContext(GlobalState)
  const dispatch = React.useContext(GlobalDispatch)
  const [selectedTag, setSelectedTag] = React.useState(props.term)
  const [selectedColor, setSelectedColor] = React.useState(props.color)

  const initialColor = React.useMemo(() => {
    return props.color
  }, [])

  const handleSetTerm = (e) => {
    dispatch({type: "setTerm", payload: {oldTerm: selectedTag, newTerm: e.target.value, hex: selectedColor}})
  }

  // set term
  const handleSetColor = (e) => {
    setSelectedColor(e.target.value)
    // dispatch({type: "setColor", payload: {term: selectedTag, hex: e.target.value}})
  }

  // set color
  React.useEffect(() => {
    dispatch({type: "setColor", payload: {term: selectedTag, hex: selectedColor}})
  }, [selectedColor])

  // delete term
  const handleDeleteTerm = () => {
    dispatch({type: "deleteTerm", payload: {term: selectedTag}})
  }

  return (
    <div className="settings__item">
      <select onChange={handleSetTerm}>
        <option value={selectedTag}>{selectedTag}</option>
        {allTags.filter(tag => {
         return tag in globalState.colors === false
        }).map((tag, i) => (
          <option value={tag} key={tag + i}>{tag}</option>
        ))}
      </select>
      <input type="color" onChange={handleSetColor} defaultValue={initialColor}></input>
      <button onClick={handleDeleteTerm}>Remove</button>
    </div>
  )
}

function reducer(state, action){

  let newColors

  switch (action.type) {
    case 'play':
      return {...state, rendering: true}

    case 'edit':
      return {...state, rendering: false}

    case 'toggleSettings':
      return {...state, settingsOpen: !state.settingsOpen}

    case 'addTerm':

      if(action.payload.term in state.colors === false){
        newColors = state.colors
        newColors[action.payload.term] = action.payload.hex

        return {...state, colors: newColors}
      }else {
        return state
      }

    case 'setTerm':
      newColors = state.colors
      newColors[action.payload.newTerm] = action.payload.hex
      delete newColors[action.payload.oldTerm]

      return {...state, colors: newColors}

    case 'setColor':
      newColors = state.colors
      newColors[action.payload.term] = action.payload.hex

      return {...state, colors: newColors}

    case 'deleteTerm':
      newColors = state.colors
      delete newColors[action.payload.term]

      return {...state, colors: newColors}

    default: 
      return state
  }
}

let App = () => {
  const [rawContent, setRawContent] = React.useState(localStorage.getItem("content") ? localStorage.getItem("content") : initialContent)
  // const [corpusData, setCorpusData] = React.useState(nlp(""))

  const [appState, dispatch] = React.useReducer(reducer, {
    rendering: false,
    settingsOpen: false,
    colors: {
      "Determiner": "#ffde37",
      "Adjective": "#96ccff",
      "Verb": "#2DFF9A",
      "Infinitive": "#b8ffe4",
      "Noun": "#ff80cc",
      "Singular": "#ff80cc",
      "Plural": "#ffa3d7",
      "Person": "#ffa3d7",
      "Expression": "#a463f2",
      "Adverb": "#ff725c",
    }
  })
  
  let handleInputChange = (e) => {
    localStorage.setItem("content", e.target.value)

    setRawContent(e.target.value)
  }

  React.useEffect(() => {
    console.log("state changed", appState)
  }, [appState])

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
