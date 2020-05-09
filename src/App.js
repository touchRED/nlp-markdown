import React from 'react';
import nlp from 'compromise'
const ReactMarkdown = require('react-markdown')

const CorpusContext = React.createContext()

let currentWord = -1

let Line = (props) => {
  const corpusContext = React.useContext(CorpusContext)
  let words

  if(!corpusContext.parseEntire) {
    const dump = nlp(props.children)
    words = dump.words().map(word => ({
      text: word.text ? word.text().trim() : "",
      id: word.list[0] ? word.list[0].start : "",
      raw: "",
      tags: word.json() ? word.json()[0].terms[0].tags : []
    }))
  }else {
    words = nlp.tokenize(props.children).terms().map(word => ({
      text: word.text ? word.text().trim(): "",
      id: word.list[0] ? word.list[0].start : "",
      raw: word.json() ? word.json() : "",
      tags: []
    }))
  }
  // console.log("words:", words)
  if(words.world) words = []
  
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
  const corpusContext = React.useContext(CorpusContext)
  let tagString

  if(!corpusContext.parseEntire) {
    tagString = props.tags ? props.tags.join(" ") : ""
  }else {
    currentWord++
    const thisWordIndex = currentWord
    const thisWordData = corpusContext.terms[thisWordIndex]

    tagString = thisWordData ? thisWordData.terms.map(term => term.tags).reduce((acc, val) => {
      return acc.concat(val)
    }, []).join(" ") : ""
  }

  // console.log(props.children, props.raw, corpusContext[thisWord])
  
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

let Renderer = (props) => {
  // console.log(props)
  // const corpusData = React.useContext(CorpusContext)
  // console.log("corpusData:", corpusData)
  // corpusData.debug()

  return (
    <>
      {props.children}
    </>
  )
}

let Editor = () => {
  const [rawContent, setRawContent] = React.useState(localStorage.getItem("content") ? localStorage.getItem("content") : "")
  const [corpusData, setCorpusData] = React.useState(nlp(""))
  const [parseEntire, setParseEntire] = React.useState(true)
  
  let handleInputChange = (e) => {
    localStorage.setItem("content", e.target.value)
    setRawContent(e.target.value)
  }

  let handleParseChange = (e) => {
    currentWord = -1
    setParseEntire(!parseEntire)
  }

  React.useEffect(() => {
    // get innerText || textContent of #renderer
    let renderer =  document.getElementById("renderer")
    let plainText = renderer.textContent || renderer.innerText

    currentWord = -1
    // console.log(plainText)
    // set corpusData to nlp() of innerText
    const dump = nlp(plainText)
    console.log(dump)
    setCorpusData(dump.terms().json())
  }, [rawContent])
  
  return (
    <>
      <textarea onChange={handleInputChange} value={localStorage.getItem("content") ? localStorage.getItem("content") : ""}></textarea>
      {/* <button onClick={handleParseChange}>Parse Mode: {parseEntire ? "Entire" : "Text"}</button> */}
      <div id="renderer">
        <CorpusContext.Provider value={{terms: corpusData, parseEntire: parseEntire}}>
          <ReactMarkdown source={rawContent} rawSourcePos={true} renderers={{
            text: Line,
            root: Renderer
          }} />
        </CorpusContext.Provider>
      </div>
    </>
  )
}

export default Editor;
