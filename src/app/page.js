import CrashLogComponent from "../components/CrashLogComponent";
import Image from "next/image";
import Logo from "../../public/skyrimcrashdecoderlogo.png";

export const metadata = {
  title: "Skyrim Crash Decoder",
  description: "Reads and analyzes your Skyrim Crash Log",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center mt-5">
      <div className="container flex flex-col items-center justify-center mx-auto mt-4 text-center">
        <Image src={Logo} alt="logo" />
      </div>

      <div className="container flex flex-col items-center justify-center mx-auto mt-8 w-5/5 md:w-4/5 lg:w-4/5 text-center">
        <p>
          Need help reading your Skyrim crash log? <br /> Skyrim Crash Decoder
          analyzes the contents of your crash log and provides assistance for
          deciphering the cause of the crash. <br /> <br />
        </p>
        <p>
          Supports Crash Logs generated by
          <a href="https://www.nexusmods.com/skyrimspecialedition/mods/59818">
            {" "}
            Crash Logger SSE AE VR
          </a>
          . <br/> Does not work well for Trainwreck or NetScriptFramework, development
          is on the process to support those tools.
          <br /> <br />
        </p>
        <p>
          Simply paste your Crash Log in the field below, then press 'Generate
          Report'
        </p>
        <CrashLogComponent />
      </div>

      <div className="container flex flex-col items-center justify-center mx-auto mt-10 text-center mb-10">
        <h4 className="text-3xl mt-3">Contact</h4>
        <p className="mt-3 mb-3">
          If you want to contact the author of this application, you can find me
          from <a href="https://www.nexusmods.com/users/169060728">Nexusmods</a>
          .
        </p>
        <img src="https://i.imgur.com/MFyo6QH.png"></img>
      </div>
    </main>
  );
}
