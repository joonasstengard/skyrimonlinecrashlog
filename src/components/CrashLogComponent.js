"use client";

import { React, useState } from 'react';

function CrashLogComponent() {
  //Define a state variable to store the user's input
  const [crashLogText, setCrashLogText] = useState('');

  //=======CONTENTS OF CRASH LOG REPORT========================================================================
  //crash log report title state
  const [crashLogReportTitle, setCrashLogReportTitle] = useState('Your Crash Log report will appear here.');
  const [crashLogReportCause, setCrashLogReportCause] = useState('');
  const [crashLogReportPlugin, setCrashLogReportPlugin] = useState('');
  const [crashLogReportModifiedBy, setCrashLogReportModifiedBy] = useState('');
  const [crashLogReportFormID, setCrashLogReportFormID] = useState('');
  const [crashLogReportName, setCrashLogReportName] = useState('');
  const [crashLogReportHowToProceed, setCrashLogReportHowToProceed] = useState('');
  //============================================================================================================

  //Function to handle changes in the textarea
  const handleTextareaChange = (event) => {
    setCrashLogText(event.target.value);
  };

  //Function to generate the report using the user's input
  const generateReport = () => {

    //loading text at the start, in case it takes a while. this will get overridden once the report is ready
    setCrashLogReportTitle("Generating report... This should take less than 5 seconds. ")
    setCrashLogReportCause("");
    setCrashLogReportPlugin("");
    setCrashLogReportFormID("");
    setCrashLogReportName("");

    
    //checks if the crash log includes the words REGISTERS:, STACK: AND MODULES:. if it doesn't it's not a valid crash log that can be read
    const wordsToCheck = ["REGISTERS:", "STACK:", "MODULES:"];
    for (const word of wordsToCheck) {
      if (!crashLogText.includes(word)) {
        setCrashLogReportTitle("It appears that you did not paste a valid crash log. Check your input. ")
        return;
      }
    }


    const crashLogLines = crashLogText.split('\n');
    const firstLineOfCrashLog = crashLogLines[0];
    const thirdLineOfCrashLog = crashLogLines[2];
    if(firstLineOfCrashLog.includes("CLA")){
      setCrashLogReportTitle("It seems that you posted the output of another crash log analyzing tool, instead of a crash log. ");
      return;
    }if(thirdLineOfCrashLog.includes("NetScriptFramework")){
      setCrashLogReportTitle("It seems that you posted a NetScriptFramework crash log. Unfortunately, NetScriptFramework crash logs are not supported by this tool. ");
      return;
    }


    //removing everything from the log before and after the REGISTERS section
    const startIndex = crashLogText.indexOf("REGISTERS:");
    const truncatedLog = startIndex !== -1 ? crashLogText.substring(startIndex) : crashLogText;
    const endIndexRegisters = truncatedLog.indexOf("STACK:");

    //registersLog is the name of the REGISTERS part of the log
    const registersLog = endIndexRegisters !== -1 ? truncatedLog.substring(0, endIndexRegisters) : truncatedLog;

    //for checking the contents of probable call stack
    const probableCallStackStartIndex = crashLogText.indexOf("PROBABLE CALL STACK:");
    const truncatedProbableCallStack = probableCallStackStartIndex !== -1 ? crashLogText.substring(probableCallStackStartIndex) : crashLogText;
    const probableCallStackEndIndex = truncatedProbableCallStack.indexOf("REGISTERS:");
    const probableCallStackLog = probableCallStackEndIndex !== -1 ? truncatedProbableCallStack.substring(0, probableCallStackEndIndex) : truncatedProbableCallStack;

    //checking if probablecallstack contains the word "dyndolod", if it does, skip everything and blame it
    const lowercaseProbableCallStack = probableCallStackLog.toLowerCase();
    const linesProbableCallStack = lowercaseProbableCallStack.split('\n');
        // Iterate through each line
        for (const line of linesProbableCallStack) {
          // Check if the line includes "dyndolod"
          if (line.includes("dyndolod")) {
            setCrashLogReportTitle("=== Skyrim Online Crash Log v1.0 Report ===");
            setCrashLogReportCause("It seems likely that the crash was caused by DynDOLOD. ");
            return;
          }
        }

    //this is what is found from the "REGISTERS:"" portion
    var reasonForCrash = handleRegistersLog(registersLog);

    //searching if the registers section includes "modified by:", if it does, this is the line
    var modifiedByLine = searchForModifiedByFromRegisters(registersLog);

    //making a string with contents of both REGISTERS section and STACK section
    const endIndexStack = truncatedLog.indexOf("MODULES:");
    const registersAndStackLog = endIndexStack !== -1 ? truncatedLog.substring(0, endIndexStack) : truncatedLog;
    //console.log('===REGISTER JA STACK=== '+registersAndStackLog);

    var espThatCausedCrash = searchForPluginFromRegistersAndStack(registersAndStackLog);
    //trimming the word "file:" from this
    if (espThatCausedCrash.startsWith("file:")) {
      // Use the `replace` method to remove the prefix
      espThatCausedCrash = espThatCausedCrash.replace("file:", "");
    }


    var formIDThatCausedCrash = searchForFormIDFromRegisters(registersLog);


    
    //generating final report--------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------
    setCrashLogReportTitle("=== Skyrim Online Crash Log v1.0 Report ===");
    setCrashLogReportCause("Reason for crash: "+reasonForCrash);
    if(modifiedByLine !== "Not found. "){
      if (modifiedByLine.startsWith("Modified by:")) {
        // Use the `replace` method to remove the prefix
        modifiedByLine = modifiedByLine.replace("Modified by:", "");
      }
      setCrashLogReportModifiedBy("Crash was likely caused by one of the following mods: "+modifiedByLine);
      setCrashLogReportPlugin("Probably one of them trying to access this mod: "+espThatCausedCrash+". ")
    }else{
      //this gets called when there is no "modified by" in registers
      //plugin
      if(espThatCausedCrash !== "Not found. "){
        setCrashLogReportPlugin("The following plugin (mod) might have been involved in the crash: "+espThatCausedCrash+". ");
      }else{
        setCrashLogReportPlugin("Unable to identify a culprit plugin from this crash log. ");
      }
    }
    
    if(formIDThatCausedCrash !== "Not found. "){
      setCrashLogReportFormID("The following record might have been involved in the crash: "+formIDThatCausedCrash+". ");
    }else{
      setCrashLogReportFormID("Unable to identify a culprit FormID from this crash log. ");
    }

    //how to proceed instructions, based on if plugins or formids were identified
    var howToProceedInstructions = "";
    if(modifiedByLine !== "Not found. "){
      howToProceedInstructions = "To fix the issue, you can try disabling one or more of the mods mentioned above. If the crash still happens, try again with a new log. ";
      if(formIDThatCausedCrash !== "Not found. "){
        howToProceedInstructions = howToProceedInstructions + "If you are an advanced Skyrim modder, you can use a tool like SSEEdit to see more information about what record the FormID contains and which mods are accessing it. ";
      }
    }else if(formIDThatCausedCrash !== "Not found. "){
      howToProceedInstructions = "If you are an advanced Skyrim modder, you can use a tool like SSEEdit to see more information about what record the FormID contains and which mods are accessing it. "
    }else{
      howToProceedInstructions = "If the crash is recurring and the above information was insufficient to point to an issue, you can try again with a new log. ";
    }

    setCrashLogReportHowToProceed(howToProceedInstructions);
    //------------------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------------------
    
    

  };

    //function for running conditionals on the REGISTERS portion of the crash log, called by generateReport
    function handleRegistersLog(registersLog){
      //Convert to lowercase for case-insensitive comparison
      const lowercaseRegistersLog = registersLog.toLowerCase();

      //console.log('=== REGISTERS LOG: ==='+lowercaseRegistersLog);
      
      //searching for keywords from the REGISTERS log
      if (lowercaseRegistersLog.includes("kdeleted")) {
        console.log('The word "kdeleted" was found in the text!');
        return "It seems that the crash might be caused by a deleted reference. This can happen when content from Mod A or Skyrim.esm is deleted by Mod B, which is then accessed by Mod C. Check the FormID section below to see which reference might've been deleted. ";
      } if (lowercaseRegistersLog.includes("facegen")) {
        console.log('The word "facegen" was found in the text!');
        return "Probably a FaceGen issue. Possibly missing or corrupt FaceGen data. ";
      } if (lowercaseRegistersLog.includes("hdtsmp") || lowercaseRegistersLog.includes("hdt-smp")) {
        console.log('The word "hdtsmp" was found in the text!');
        return "Possible HDT-SMP related issue. ";
      } if (lowercaseRegistersLog.includes("tesobjectrefr")) {
        console.log('The word "TESObjectREFR" was found in the text!');
        return "Probably an issue with an Object Reference (this could be an item or an NPC placed or modified by a mod). ";
      } if (lowercaseRegistersLog.includes("tesnpc")) {
        console.log('The word "TESNPC" was found in the text!');
        return "Probably an issue with an NPC. ";
      } if (lowercaseRegistersLog.includes("navmesh")) {
        console.log('The word navmesh was found in the text!');
        return "Seems like a navmesh related issue. ";
      } if (lowercaseRegistersLog.includes("tesobjectcell")) {
        console.log('The word TESObjectCELL was found in the text!');
        return "Probably an issue with a cell. ";
      } if (lowercaseRegistersLog.includes("bgslocation")) {
        console.log('The word BGSLocation was found in the text!');
        return "Probably an issue related to a location. ";
      } if (lowercaseRegistersLog.includes("textures")) {
        console.log('The word TEXTURES was found in the text!');
        //getting the line that includes textures, in hopes that its the filepath or other indication of the texture
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes "formid"
          if (line.includes("textures")) {
            // If found, return the line
            return "The following texture is seemingly causing an issue: "+line.trim();
          }
        }
        return "Possibly an issue with a texture. ";
      }  if (lowercaseRegistersLog.includes("ninode")) {
        //KOKEELLINEN
        console.log('The word ninode was found in the text!');
        return "Possibly a skeleton related issue. ";
      } if (lowercaseRegistersLog.includes("bslightningshader")) {
        //KOKEELLINEN
        console.log('The word BSLightingShader was found in the text!');
        return "Possibly a BSLightingShader related issue. ";
      } if (lowercaseRegistersLog.includes("playercharacter")) {
        //KOKEELLINEN
        console.log('The word PlayerCharacter was found in the text!');
        return "Possibly an issue related to the Player character. ";
      } else {
        console.log('Could not identify any issue keywords from REGISTERS. ');
        return "Unable to identify a clear cause for the crash. ";
      }



    }


    //function for searching for the first mention of a .esp from registers, if not in there then stacks
    function searchForPluginFromRegistersAndStack(registersAndStackLog){
      //Convert to lowercase for case-insensitive comparison
      const lowercaseRegistersAndStackLog = registersAndStackLog.toLowerCase();

      //console.log('=== REGISTERS & STACK LOG: ==='+lowercaseRegistersAndStackLog);

      const excludedWords = ["skyrim.esm", "update.esm", "dawnguard.esm", "hearthfires.esm", "dragonborn.esm", "unofficial skyrim",
        "ccQDRSSE001", "ccbgssse014", "ccbgssse002", "ccbgssse007", "ccmtysse001", "ccbgssse003", "ccbgssse004", "ccbgssse019", "ccbgssse006", 
        "ccbgssse010", "ccbgssse021", "ccfsvsse001", "ccqdrsse002", "ccbgssse035", "ccbgssse018", "cceejsse001", "cceejsse002", "ccedhsse001", 
        "ccvsvsse002", "ccbgssse037", "ccbgssse036", "ccbgssse045", "ccbgssse034", "ccffbsse001", "ccbgssse043", "cctwbsse001", "ccvsvsse001", 
        "ccbgssse008", "ccmtysse002", "ccpewsse002", "cceejsse003", "ccedhsse002", "ccbgssse016", "ccbgssse062", "ccbgssse057", "ccbgssse013", 
        "ccffbsse002", "ccbgssse041", "ccbgssse051", "ccbgssse060", "ccbgssse064", "ccbgssse063", "ccbgssse058", "ccbgssse031", "ccbgssse040",
        "ccbgssse025", "cceejsse004", "ccbgssse020", "ccbgssse050", "ccbgssse059", "ccbgssse061", "ccbgssse052", "ccbgssse053", "ccbgssse054", 
        "ccbgssse055", "ccbgssse056", "cckrtsse001", "cceejsse005", "ccbgssse038", "ccvsvsse004", "cccbhsse001", "ccBGSSSE001", "ccrmssse001", 
        "ccasvsse001", "ccbgssse005", "ccbgssse068", "ccbgssse011", "ccbgssse012", "ccafdsse001", "ccVSVSSE003", "ccedhsse003", "ccbgssse066", "ccbgssse067"];
      
      //searching for ESP
      //Split the input string into lines
      const lines = lowercaseRegistersAndStackLog.split('\n');

      //Iterate through each line
      for (const line of lines) {
        //Check if the line includes ".esp"
        if ((line.includes(".esp") || line.includes(".esl") || line.includes(".esm")) &&
        !excludedWords.some(word => line.includes(word))) {
      //If found and not containing excluded words, return the line
      return line.trim();
    }
  }

      // If esp is not found, return null or a message indicating it wasn't found
      return "Not found. ";

    }

    //function for searching for the first mention of a form id from REGISTERS
    //THIS ALSO ADDS THE NAME OF THE FORMID if name of the formID will come before it.
    function searchForFormIDFromRegisters(registersLog){
      //Convert to lowercase for case-insensitive comparison
      const lowercaseRegistersLog = registersLog.toLowerCase();

      //this is where the name and formid will be added to, assuming that a name is found
      var nameFormIdStr = "";
      
      //searching for FORMID
      // Split the input string into lines
      const lines = lowercaseRegistersLog.split('\n');

      // Iterate through each line
      for (const line of lines) {
        
        //Check if the line includes "name"
        if (line.includes("name:")) {
          console.log("Found a name! here: "+line.trim());
          nameFormIdStr = line.trim();
          console.log('checking if it works: '+crashLogReportName);
        }
        // Check if the line includes "formid"
        if (line.includes("formid:")) {
          // If found, return the line
          nameFormIdStr = nameFormIdStr + " " + line.trim();
          return nameFormIdStr;
        }
      }
      // If "FormID:" is not found, return null or a message indicating it wasn't found
      return "Not found. ";
    }

    //function for searching for the first mention of a form id from REGISTERS
    function searchForModifiedByFromRegisters(registersLog){
      //Convert to lowercase for case-insensitive comparison
      
      //searching for modified by
      // Split the input string into lines
      const lines = registersLog.split('\n');

      // Iterate through each line
      for (const line of lines) {
        // Check if the line includes "formid"
        if (line.includes("Modified by:")) {
          // If found, return the line
          return line.trim();
        }
      }
      // If "modified by" is not found, return this
      return "Not found. ";
    }



  return (
    <div className="container flex flex-col items-center justify-center mx-auto mt-10">
      <textarea
        placeholder="Paste your Crash Log here."
        className="border border-gray-600 w-3/5 p-2 mt-2 rounded-md font-semibold hover:border-gray-700 bg-black h-64 resize-y"
        id="crashLogInput"
        value={crashLogText} // Bind the value of the textarea to the state variable
        onChange={handleTextareaChange} // Call handleTextareaChange when the textarea changes
      />
      <button
        className="border border-gray-600 mt-6 p-3 rounded-md hover:border-gray-700"
        onClick={generateReport} // Call generateReport when the button is clicked
      >
        Generate report
      </button>

      <h4 className="text-3xl mt-10">Report</h4>
      <div className="border border-gray-600 w-3/5 p-2 mt-5 rounded-md font-semibold bg-black resize-y">
          <p className="mt-3 mb-3">{crashLogReportTitle}</p>
          <p className="mt-3 mb-3">{crashLogReportCause}</p>
          <p className="mt-3 mb-3">{crashLogReportModifiedBy}</p>
          <p className="mt-3 mb-3">{crashLogReportPlugin}</p>
          <p className="mt-3 mb-3">{crashLogReportFormID}</p>
          <p className="mt-3 mb-3">{crashLogReportHowToProceed}</p>
      </div>
    </div>
  );
}

export default CrashLogComponent;
