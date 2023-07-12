import React from 'react';
import { useState, useEffect, useRef } from 'react';
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
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  const jsPsychTarget = useRef(null);

  const userID = useSelector(state => state.userInfo.userID);

  const startExperiment = async () => {

    await pushkin.connect(api);
    await pushkin.prepExperimentRun(userID);

    const jsPsych = initJsPsych({
      display_element: jsPsychTarget.current,
      on_finish: endExperiment,
    });

    jsPsych.data.addProperties({user_id: this.props.userID}); //See https://www.jspsych.org/core_library/jspsych-data/#jspsychdataaddproperties
    
    const timeline = createTimeline(jsPsych);

    jsPsych.run(timeline);

    jsPsychTarget.current.focus();


    setLoading(false);
  }

  const endExperiment = async () => {
    setSaving(true);
    await pushkin.tabulateAndPostResults(this.props.userID, expConfig.experimentName);
    setFinished(true);
  }

  useEffect(() => {
    startExperiment();
  }, []);

  return (
    <div>
      {loading && <h1>Loading...</h1>}
      {(saving && !finished) && <h1>Processing...</h1>}
      {finished && <h1>Finished...</h1>}
      <div id="jsPsychTarget" ref={jsPsychTarget} />
    </div>
  );
}