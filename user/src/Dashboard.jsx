import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Spinner from "../components/Spinner";
import { getGoals, reset } from "../features/goals/goalSlice";

// ---------- webcam ------------- //
import Webcam from "webcamjs";

import { getSimilarityBetweenFaces, initializeNet } from '../js/engine.js'
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const imageRef = useRef(null);
  const webcamRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, message } = useSelector((state) => state.goals);

  const [working, setWorking] = useState(true)
  const [failedCnt, setFailedCnt] = useState(0)       //Count failed recognition
  const [failedTime, setFailedTime] = useState(0)     //saves the last time



  useEffect(() => {
    if (isError) {
      console.log(message);
    }

    if (!user) {
      navigate("/login");
    }

    // dispatch(getGoals());

    return () => {
      dispatch(reset());
    };
  }, [user, navigate, isError, message, dispatch]);

  useEffect(() => {
    if (webcamRef.current) {
      Webcam.set({
        width: 317,
        height: 280,
        image_format: "jpeg",
        jpeg_quality: 90,
      });
      Webcam.attach(webcamRef.current);
    }

    return () => {
      Webcam.reset();
    };
  }, []);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     captureImage();
  //   }, 5000);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  useEffect(() => {
    console.log("failed Cnt: ", failedCnt)
    if (working && failedCnt >= 6) {
      var curTime = parseInt(Date.now() / 60000)  //get the current time in minutes since January 1, 1970, 00:00:00 UTC.
      setFailedTime(curTime)
      console.log("failed Time: ", failedTime)
      setWorking(false)
    }
  }, [failedCnt, failedTime, working])

  useEffect(() => {


    const captureImage = () => {
      return new Promise(async (resolve, reject) => {
        Webcam.snap(async (data_uri) => {
          imageRef.current.src = data_uri;
          const image = data_uri;

          try {
            const result = await getSimilarityBetweenFaces(user.image, image);
            console.log("similarity: ", result.toString());
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    };

    const checkworking = (similiarity) => {
      // console.log("similarity in checkworking: ", similiarity)
      if (similiarity < 0.6) {
        var curTime = parseInt(Date.now() / 60000)
        // console.log('similarity is less than 0.6')
        if (!working) {
          if (curTime > failedTime) {
            console.log("current time: ", curTime)
            console.log("failed time: ", failedTime)
            setFailedCnt(0)
            setWorking(true)
          }
        } else {
          setFailedCnt(0)
        }

      } else {
        setFailedCnt((cnt) => (cnt + 1))
      }
    }

    const captureImageInterval = async () => {
      captureImage().then((similarity) => {
        checkworking(similarity);
      });
    };

    const interval = setInterval(captureImageInterval, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [working]);

  // To Initialize face-api Net when landing page is loading
  useEffect(() => {
    const initialize = async () => {
      await initializeNet()
    }

    initialize()
  }, [])

  // inform server whether user in front of PC or not.
  useEffect(() => {
    let flag = 0;
    let user = JSON.parse(localStorage.getItem('user'));

    if (working) {
      console.log("user is working")
      flag = 1;
    } else {
      console.log("user is not working");
    }
    const data = {
      userid: user._id,
      flag: flag
    }
    axios.post('/api/timetrack/settime', data)
  }, [working])

  // useEffect(() => {
  //   if (working && failedCnt >= 6) {
  //     var curTime = Date.now() / 60000  //get the current time in minutes since January 1, 1970, 00:00:00 UTC.
  //     setFailedTime(curTime)
  //     setWorking(false)
  //   }
  // }, [failedCnt])



  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <section className="heading">
        <h1>Welcome</h1>
      </section>

      <section className="form">
        <div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "320px",
                height: "280px",
                outline: "2px solid black",
                marginBottom: "20px",
                display: "none",
              }}
            >
              <div ref={webcamRef}></div>
            </div>
            <div
              className="form-group"
              style={{
                width: "320px",
                height: "280px",
                outline: "2px solid black",
                marginBottom: "20px",
              }}
            >
              <div>
                <img
                  ref={imageRef}
                  alt="Please Click Capture Button"
                  style={{ height: "240px", width: "320px", marginTop: "4px" }}
                ></img>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;