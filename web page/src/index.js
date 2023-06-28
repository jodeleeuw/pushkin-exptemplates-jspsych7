import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import pushkinClient from 'pushkin-client';
import { initJsPsych } from 'jspsych';
import { createTimeline } from './experiment';
import jsYaml from 'js-yaml';
const fs = require('fs');

//stylin'
import './assets/experiment.css'

const expConfig = jsYaml.load(fs.readFileSync('../config.yaml'), 'utf8');

const pushkin = new pushkinClient();

export default function QuizComponent({ api }) {
  const [loading, setLoading] = useState(true);

  const userID = useSelector(state => state.userInfo.userID);

  const startExperiment = async () => {

    await pushkin.connect(api);
    await pushkin.prepExperimentRun(userID);

    const jsPsych = initJsPsych({
      display_element: document.getElementById('jsPsychTarget'),
      on_finish: this.endExperiment.bind(this),
    });

    jsPsych.data.addProperties({user_id: this.props.userID}); //See https://www.jspsych.org/core_library/jspsych-data/#jspsychdataaddproperties
    
    const timeline = createTimeline(jsPsych);

    jsPsych.run(timeline);

    document.getElementById('jsPsychTarget').focus();

    setLoading(false);
  }

  const endExperiment = async () => {
    document.getElementById("jsPsychTarget").innerHTML = "Processing...";
    await pushkin.tabulateAndPostResults(this.props.userID, expConfig.experimentName)
    document.getElementById("jsPsychTarget").innerHTML = "Thank you for participating!";
  }

  useEffect(() => {
    startExperiment();
  }, []);

  return (
    <div>
      {loading && <h1>Loading...</h1>}
      <div id="jsPsychTarget" />
    </div>
  );
}