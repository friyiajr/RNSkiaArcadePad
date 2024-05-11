import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import React from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";

import { Canvas, Circle, Skia, matchFont } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { polar2Canvas } from "react-native-redash";

const { height: fullHeight, width: fullWidth } = Dimensions.get("screen");

const screenWidth = 275;
const screenHeight = 275;

const NUM_POINTS = 8;

interface Point {
  outerX: number;
  outerY: number;
}

const positions = [
  "DOWN FORWARD",
  "DOWN",
  "DOWN BACK",
  "BACK",
  "UP BACK",
  "UP",
  "UP FORWARD",
  "FORWARD",
];

function createOuterPoints(): Point[] {
  const points = [];

  const angleStep = (Math.PI * 2) / NUM_POINTS;

  const outerRad = 160;

  const middleX = screenWidth / 2;
  const middleY = screenHeight / 2;

  for (let i = 1; i <= NUM_POINTS; i++) {
    const theta = i * angleStep;
    const outerX = middleX + Math.cos(theta) * outerRad;
    const outerY = middleY + Math.sin(theta) * outerRad;

    points.push({
      outerX: outerX + fullWidth / 6.5,
      outerY: outerY + fullHeight / 3,
    });
  }

  return points;
}

function createPoints(): Point[] {
  const points = [];

  const angleStep = (Math.PI * 2) / NUM_POINTS;

  const outerRad = 130;

  const middleX = screenWidth / 2;
  const middleY = screenHeight / 2;

  for (let i = 1; i <= NUM_POINTS; i++) {
    const theta = i * angleStep;
    const outerX = middleX + Math.cos(theta) * outerRad;
    const outerY = middleY + Math.sin(theta) * outerRad;

    points.push({
      outerX,
      outerY,
    });
  }

  return points;
}

interface Props {
  point: Point;
  idx: number;
  isForward: boolean;
}

const Main = () => {
  const innerPoints = createPoints();
  const outerPoints = createOuterPoints();
  const path = Skia.Path.Make();
  const upOpacity = useSharedValue(0.4);
  const forwardOpacity = useSharedValue(0.4);
  const downOpacity = useSharedValue(0.4);
  const leftOpacity = useSharedValue(0.4);
  const upForwardOpacity = useSharedValue(0.4);
  const downForwardOpacity = useSharedValue(0.4);
  const downBackOpacity = useSharedValue(0.4);
  const upBackOpacity = useSharedValue(0.4);

  path.moveTo(innerPoints[0].outerX, innerPoints[0].outerY);
  for (let i = 1; i < innerPoints.length; i++) {
    path.lineTo(innerPoints[i].outerX, innerPoints[i].outerY);
  }

  const middleX = screenWidth / 2;
  const middleY = screenHeight / 2;

  const positionX = useSharedValue(middleX);
  const positionY = useSharedValue(middleY);
  const readablePosition = useSharedValue("NEUTRAL");

  const gesture = Gesture.Pan()
    .onChange(({ translationX, translationY }) => {
      const oldCanvasX = translationX + middleX;
      const oldCanvasY = translationY + middleY;

      const center = screenWidth / 2;

      const xPrime = oldCanvasX - center;
      const yPrime = -(oldCanvasY - center);
      const rawTheta = Math.atan2(yPrime, xPrime);

      const newCoords = polar2Canvas(
        {
          theta: rawTheta,
          radius: screenWidth / 2 - 50,
        },
        {
          x: center,
          y: center,
        }
      );

      positionX.value = oldCanvasX;
      positionY.value = oldCanvasY;

      if (oldCanvasX >= newCoords.x && oldCanvasX >= center) {
        positionX.value = newCoords.x;
      } else if (oldCanvasX < newCoords.x && oldCanvasX < center) {
        positionX.value = newCoords.x;
      }

      if (oldCanvasY >= newCoords.y && oldCanvasY >= center) {
        positionY.value = newCoords.y;
      } else if (oldCanvasY <= newCoords.y && oldCanvasY <= center) {
        positionY.value = newCoords.y;
      }

      const distances = [];

      for (let i = 0; i < innerPoints.length; i++) {
        const xDist = Math.pow(positionX.value - innerPoints[i].outerX, 2);
        const yDist = Math.pow(positionY.value - innerPoints[i].outerY, 2);

        const euclideanDistance = Math.sqrt(xDist + yDist);

        distances.push({
          position: positions[i],
          distance: euclideanDistance,
        });
      }

      distances.sort((a, b) => a.distance - b.distance);

      if (oldCanvasX === screenWidth / 2 && oldCanvasY === screenHeight / 2) {
        return;
      }
      readablePosition.value = distances[0].position;

      if (distances[0].position === "UP") {
        upOpacity.value = 1;
      } else {
        upOpacity.value = 0.4;
      }
      if (distances[0].position === "FORWARD") {
        forwardOpacity.value = 1;
      } else {
        forwardOpacity.value = 0.4;
      }

      if (distances[0].position === "DOWN") {
        downOpacity.value = 1;
      } else {
        downOpacity.value = 0.4;
      }

      if (distances[0].position === "BACK") {
        leftOpacity.value = 1;
      } else {
        leftOpacity.value = 0.4;
      }

      if (distances[0].position === "UP FORWARD") {
        upForwardOpacity.value = 1;
      } else {
        upForwardOpacity.value = 0.4;
      }

      if (distances[0].position === "DOWN FORWARD") {
        downForwardOpacity.value = 1;
      } else {
        downForwardOpacity.value = 0.4;
      }

      if (distances[0].position === "DOWN BACK") {
        downBackOpacity.value = 1;
      } else {
        downBackOpacity.value = 0.4;
      }

      if (distances[0].position === "UP BACK") {
        upBackOpacity.value = 1;
      } else {
        upBackOpacity.value = 0.4;
      }
    })
    .onEnd(() => {
      positionX.value = middleX;
      positionY.value = middleY;
      readablePosition.value = "NEUTRAL";
      upOpacity.value = 0.4;
      forwardOpacity.value = 0.4;
      downOpacity.value = 0.4;
      leftOpacity.value = 0.4;
      upForwardOpacity.value = 0.4;
      downForwardOpacity.value = 0.4;
      downBackOpacity.value = 0.4;
      upBackOpacity.value = 0.4;
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          {/* <Path path={path} color={"white"} /> */}
          <Circle
            cx={screenWidth / 2}
            cy={screenHeight / 2}
            r={125}
            color={"black"}
          />
          <Circle cx={positionX} cy={positionY} r={40} color={"red"} />
          {/* <Text
            x={middleX - 20}
            y={screenHeight}
            text={readablePosition}
            font={font}
            color={"black"}
          /> */}
        </Canvas>
        <View
          style={{
            backgroundColor: "transparent",
            position: "absolute",
            height: fullHeight,
            width: fullWidth,
          }}
        >
          <Canvas style={styles.canvas2}>
            {outerPoints.map((point, idx) => {
              if (idx === 0) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={downForwardOpacity}
                  />
                );
              } else if (idx === 1) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={downOpacity}
                  />
                );
              } else if (idx === 2) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={downBackOpacity}
                  />
                );
              } else if (idx === 3) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={leftOpacity}
                  />
                );
              } else if (idx === 4) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={upBackOpacity}
                  />
                );
              } else if (idx === 5) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={upOpacity}
                  />
                );
              } else if (idx === 6) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={upForwardOpacity}
                  />
                );
              } else if (idx === 7) {
                return (
                  <Circle
                    key={idx}
                    cx={point.outerX}
                    cy={point.outerY}
                    r={10}
                    opacity={forwardOpacity}
                  />
                );
              }
            })}
          </Canvas>
        </View>
      </View>
    </GestureDetector>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView>
      <Main />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "grey",
  },
  canvas: {
    backgroundColor: "transparent",
    width: screenWidth,
    height: screenHeight,
  },
  canvas2: {
    backgroundColor: "transparent",

    width: screenWidth + 200,
    height: screenHeight + 400,
  },
  button: {
    position: "absolute",
    backgroundColor: "purple",
    height: 60,
    width: 150,
    bottom: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
  },
});
