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
    //initializing others because ppl can post multiple logs in a row
    setCrashLogReportTitle("Generating report... This should take less than 5 seconds. ")
    setCrashLogReportCause("");
    setCrashLogReportModifiedBy("");
    setCrashLogReportPlugin("");
    setCrashLogReportFormID("");
    setCrashLogReportName("");
    setCrashLogReportHowToProceed("");

    
    

    //first and third line are used for checking for specific erraneous inputs, 2nd line is used for checking if it exists
    const crashLogLines = crashLogText.split('\n');
    const firstLineOfCrashLog = crashLogLines[0];
    const secondLineOfCrashLog = crashLogLines[1];
    const thirdLineOfCrashLog = crashLogLines[2];

    if(firstLineOfCrashLog === undefined || secondLineOfCrashLog === undefined || thirdLineOfCrashLog === undefined){
      setCrashLogReportTitle("It appears that you did not paste a full crash log. ")
        return;
    }

    if(firstLineOfCrashLog.includes("CLA")){
      setCrashLogReportTitle("It seems that you posted the output of another crash log analyzing tool, instead of a crash log. ");
      return;
    }if(thirdLineOfCrashLog.includes("NetScriptFramework") || (firstLineOfCrashLog.includes("NetScriptFramework"))){
      setCrashLogReportTitle("It seems that you posted a NetScriptFramework crash log. Unfortunately, NetScriptFramework crash logs are not supported by this tool. ");
      return;
    }

    //checks if the crash log includes the words REGISTERS:, STACK: AND MODULES:. if it doesn't it's not a valid crash log that can be read
    const wordsToCheck = ["REGISTERS:", "STACK:", "MODULES:"];
    for (const word of wordsToCheck) {
      if (!crashLogText.includes(word)) {
        setCrashLogReportTitle("It appears that you did not paste a valid crash log. Check your input. ")
        return;
      }
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
            setCrashLogReportTitle("== Skyrim Crash Decoder v1.0 Report ==");
            setCrashLogReportCause("It seems likely that the crash was caused by DynDOLOD. ");
            return;
          }
        }

    

    //searching if the registers section includes "modified by:", if it does, this is the line
    var modifiedByLine = searchForModifiedByFromRegisters(registersLog);

    //making a string with contents of both REGISTERS section and STACK section
    const endIndexStack = truncatedLog.indexOf("MODULES:");
    const registersAndStackLog = endIndexStack !== -1 ? truncatedLog.substring(0, endIndexStack) : truncatedLog;

    //searching for a reason for the crash
    var reasonForCrash = handleRegistersLog(registersLog, registersAndStackLog);

    var espThatCausedCrash = searchForPluginFromRegistersAndStack(registersAndStackLog);
    //trimming the word "file:" from this
    if (espThatCausedCrash.startsWith("file:")) {
      // Use the `replace` method to remove the prefix
      espThatCausedCrash = espThatCausedCrash.replace("file:", "");
    }


    var formIDThatCausedCrash = searchForFormIDFromRegisters(registersLog);


    
    //generating final report--------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------
    setCrashLogReportTitle("== Skyrim Crash Decoder v1.0 Report ==");
    setCrashLogReportCause(reasonForCrash);
    if(modifiedByLine !== "Not found. "){
      if (modifiedByLine.startsWith("Modified by:")) {
        // Use the `replace` method to remove the prefix
        modifiedByLine = modifiedByLine.replace("Modified by:", "");
      }
      setCrashLogReportModifiedBy("Crash was likely caused by one of the following mods: "+modifiedByLine);
      setCrashLogReportPlugin("Probably one of them accessing or clashing with this mod: "+espThatCausedCrash+". ")
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
      setCrashLogReportFormID("Unable to identify more information from this crash log. ");
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
    function handleRegistersLog(registersLog, registersAndStackLog){
      //Convert to lowercase for case-insensitive comparison
      const lowercaseRegistersLog = registersLog.toLowerCase();

      //console.log('=== REGISTERS LOG: ==='+lowercaseRegistersLog);
      
      //searching for keywords from the REGISTERS log
      if (lowercaseRegistersLog.includes("kdeleted")) {
        return "It seems that the crash might be caused by a deleted reference. This can happen when content from Mod A or Skyrim.esm is deleted by Mod B, which is then accessed by Mod C. Check the FormID section below to see which reference might've been deleted. ";
      } if (lowercaseRegistersLog.includes("facegen")) {
        //getting the line that includes name
        const lines = registersAndStackLog.split('\n');
        // terate through each line
        for (const line of lines) {
          //Check if the line includes "name"
          if (line.includes("Name:")) {
            // If found, return the line
            return "Probably a FaceGen issue. Could be missing or corrupt FaceGen data or some other NPC face related problem. Possibly related to: "+line.trim();
          }
        }
        return "Probably a FaceGen issue. Possibly missing or corrupt FaceGen data or some other NPC face related problem. ";
      } if (lowercaseRegistersLog.includes("movementagentpathfollowervirtual")) {
        return "Seems like an issue related to follower pathing. People who use follower mods or follower framework mods report experiencing this crash, especially when travelling. This can also be caused by other allies, summons or animals, even horses. If there was an NPC following you when this crash happened, you can try disabling related mods or tweaking with their mods settings. ";
      } if (lowercaseRegistersLog.includes("tesobjectrefr")) {
        return "Probably an issue with an Object Reference (this could be an item or an NPC placed or modified by a mod). ";
      } if (lowercaseRegistersLog.includes("teslevitem")) {
        return "It looks like a leveled item is causing an issue. Check below in the report if the tool was able to find the name and/or the FormID of the problematic item or its origin mod. ";
      }if (lowercaseRegistersLog.includes("tesnpc")) {
        return "Probably an issue with an NPC. ";
      } if (lowercaseRegistersLog.includes("navmesh")) {
        return "Seems like a navmesh related issue. ";
      } if (lowercaseRegistersLog.includes("tesobjectcell")) {
        return "Probably an issue with a cell. ";
      } if (lowercaseRegistersLog.includes("bgslocation")) {
        return "Probably an issue related to a location. ";
      } if (lowercaseRegistersLog.includes("textures")) {
        //getting the line that includes textures, in hopes that its the filepath or other indication of the texture
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes "textures"
          if (line.includes("textures")) {
            // If found, return the line
            return "The following texture is seemingly causing an issue: "+line.trim();
          }
        }
        return "Possibly an issue with a texture. ";
      } if (lowercaseRegistersLog.includes(".nif")) {
        //getting the line that includes .nif, in hopes that its the filepath or other indication of it
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes ".nif"
          if (line.includes(".nif")) {
            // If found, return the line
            return "The following mesh is seemingly part of the issue: "+line.trim();
          }
        }
        return "Possibly an issue with a mesh. Could not pinpoint a problematic mesh from this log. ";
      } if (lowercaseRegistersLog.includes("testopicinfo")) {
        //KOKEELLINEN
        return "Seems like a dialog related issue. ";
      } if (lowercaseRegistersLog.includes("bslightingshadermaterialenvmap")) {                     
        //getting the line that includes Full Name, for more info
        const lines = registersAndStackLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes ".nif"
          if (line.includes("Full Name:")) {
            // If found, return the line
            var lineWithoutPrefix = line.replace("Full Name:", "");
            return "Seems like an issue with a BSLightingShaderMaterialEnvmap. Possibly related to the following: "+lineWithoutPrefix.trim();
          }
        }
        return "Seems like an issue with a BSLightingShaderMaterialEnvmap. ";
      } if (lowercaseRegistersLog.includes("bslightingshader")) {
        //KOKEELLINEN
        //getting the line that includes Full Name, for more info
        const lines = registersAndStackLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes ".nif"
          if (line.includes("Full Name:")) {
            // If found, return the line
            var lineWithoutPrefix = line.replace("Full Name:", "");
            return "Possibly an issue with a BSLightingShader. Possibly related to the following: "+lineWithoutPrefix.trim();
          }
        }
        return "Possibly a BSLightingShader related issue. ";
      } if (lowercaseRegistersLog.includes("playercharacter")) {
        //KOKEELLINEN
        return "Possibly an issue related to the Player character. These are often very generic crashes that are difficult to diagnoze from the log. You can try to think of any mods that are affecting the player character, especially at the moment when the crash happened. This could include animation mods and mods accessing the player record directly, as well as more indirect mods. ";
      } if (lowercaseRegistersLog.includes("bsgeometrylistcullingprocess")) {
        //KOKEELLINEN
        return "The crash is related to BSGeometryListCullingProcess. Unfortunately, the author of this application is not very familiar with what that means. From Google, I was able to find speculation that it might be related to Occlusion planes or cubes in a cell, but I can't confirm this. Mods that have been reported to cause this issue include at least FacelightPlus and eFPS. ";
      } if (lowercaseRegistersLog.includes("bsgeometrylistcullingprocess")) {
        //KOKEELLINEN
        return "The crash is related to BSGeometryListCullingProcess. Unfortunately, the author of this application is not very familiar with what that means. From Google, I was able to find speculation that it might be related to Occlusion planes or cubes in a cell, but I can't confirm this. Mods that have been reported to cause this issue include at least FacelightPlus and eFPS. ";
      } if (lowercaseRegistersLog.includes("shadowscenenode")) {
        //KOKEELLINEN
        return "Looks like a ShadowSceneNode related crash. ShadowSceneNode issues are very generic and despite the name, they often aren't directly related to shadows. Unfortunately it's hard to give detailed help for this problem, but you can do a google search for ShadowSceneNode to find discussions and possible solutions for this problem. ";
      } if (lowercaseRegistersLog.includes("bgsloadgamebuffer")) {
        //KOKEELLINEN
        return "The crash log is pointing to BGSLoadGameBuffer. There is speculation online that this issue might be related to your save file and that tweaking with your EngineFixes.toml settings will solve this. First step: download the mod SSE Engine Fixes. Then locate the file EngineFixes.toml and replace SaveGameMaxSize = false with true. You can also try loading an earlier save and see if it fixes this issue. ";
      } if (lowercaseRegistersLog.includes("savestoragewrapper")) {
        //KOKEELLINEN
        return "The crash log is pointing to SaveStorageWrapper. There is some speculation online that it might be related to crashing during saving or auto-saving, or even problems in the save file. But that is unconfirmed and seems highly unlikely as following crash logs in this situation tend to point to something else. Try to get another crash and see if we can get a more informative log. ";
      } if (lowercaseRegistersLog.includes("ninode")) {
        //trying to find the NiNode causing issues
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes name
          if (line.includes("name:")) {
            // If found, return the line
            return "Looks like it might be a NiNode issue, possibly related to: "+line.trim();
          }
        }
        return "Possibly a NiNode related issue. NiNodes are skinned and rigged meshes. This time, the problematic NiNode was not identified. You can try getting a new crash log to see if we can find it. ";
      } if (lowercaseRegistersLog.includes("hka") || (lowercaseRegistersLog.includes("hkb"))) {
        //trying to find the animation causing issues
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes name
          if (line.includes("name:")) {
            // If found, return the line
            return "It might be an animation issue, possibly related to: "+line.trim();
          }
        }
        return "Possibly an animation related issue. Try again with a new log if the tool fails to identify the faulty animation. ";
      } if (lowercaseRegistersLog.includes("tesobjectarmo")) {
        //trying to find the armor causing issues
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes name
          if (line.includes("name:")) {
            // If found, return the line
            return "Probably an issue related to some armor, clothing or jewelry piece, possibly related to this: "+line.trim();
          }
        }
        return "Probably an issue related to some armor, clothing or jewelry piece. Can't seem to pinpoint the exact object from this log. ";
      } if (lowercaseRegistersLog.includes("movementpathmanagerarbiter")) {
        return "Seems like an NPC pathing related issue. See below if the tool is able to give more details about what is causing it. For more information, you can also google for MovementPathManagerArbiter and see discussions about other people having the same issue. ";
      } if (lowercaseRegistersLog.includes("hdtsmp") || lowercaseRegistersLog.includes("hdt-smp")) {
        return "Possible HDT-SMP related issue. ";
      } if (lowercaseRegistersLog.includes("bsxaudio2")) {
        return "Seems like a BSXAudio2 related issue. There is very little information related to this issue available on the internet. Reportedly updating drivers/direct x 11/vsruntime can remedy this issue. ";
      } if (lowercaseRegistersLog.includes("memoryheap")) {
        return "Possibly a memory heap related issue. ";
      } if (lowercaseRegistersLog.includes("ostim.dll")) {
        return "Probably an issue related to the mod Ostim. ";
      } if (lowercaseRegistersLog.includes("armor")) {
        //trying to find the animation causing issues
        const lines = lowercaseRegistersLog.split('\n');
        // Iterate through each line
        for (const line of lines) {
          // Check if the line includes name
          if (line.includes("armor")) {
            // If found, return the line
            return "Can't give a simple answer for this log, but it seems like it could be related to: "+line.trim();
          }
        }
        return "Can't seem to pinpoint the issue. ";
      } if (lowercaseRegistersLog.includes("hrtfxapoeffect")) {
        //trying to see if its an audio related issue
        const lines = registersAndStackLog.split('\n');
        //Iterate through each line
        for (const line of lines) {
          //Check if the line includes ".nif"
          if (line.includes("Audio")) {
            //If found, return the line
            return "There is very little information available online about HrtfXapoEffect, but it could indicate an audio related issue. Possible related to the following line in your crash log: "+line.trim();
          }
        }
        return "There is very little information available online about HrtfXapoEffect, but it could indicate an audio related issue. ";
      } if (lowercaseRegistersLog.includes("bssscript::internal::virtualmachine")) {
        return "The crash log seems to be pointing to BSScript::Internal::VirtualMachine. Unfortunately, there is extremely little information available about what that means. Don't be fooled by the word script in the name though, this crash probably has nothing to do with Papyrus. Try to get another crash log. ";
      } if (lowercaseRegistersLog.includes("bgsprocedurefindexecstate")) {
        return "The crash log seems to point to BGSProcedureFindExecState. This is an exceedingly rare crash, unfortunately there is practically no information about this available online. Could be related to AI packages, but there is no proof for that. Try to get another crash log. ";
      } else {
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
          nameFormIdStr = line.trim();
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
    <div className="container flex flex-col items-center justify-center mx-auto mt-5">
      <textarea
        placeholder="Paste your Crash Log here."
        className="border border-gray-400 w-full lg:w-3/5 p-2 mt-2 rounded-md font-semibold hover:border-gray-700 bg-black bg-opacity-75 h-64 resize-y"
        id="crashLogInput"
        value={crashLogText} // Bind the value of the textarea to the state variable
        onChange={handleTextareaChange} // Call handleTextareaChange when the textarea changes
      />
      <button
        className="border border-gray-400 mt-3 p-3 rounded-md hover:border-gray-700 bg-black bg-opacity-75"
        onClick={generateReport} // Call generateReport when the button is clicked
      >
        Generate report
      </button>

      <h4 className="text-3xl mt-10">Report</h4>
      <div className="border border-gray-400 w-full lg:w-3/5 pt-2 pl-4 pr-4 pb-4 mt-3 rounded-md font-semibold bg-black bg-opacity-75 resize-y my-component">
          <p className="mt-3 mb-3 text-center">{crashLogReportTitle}</p>
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
