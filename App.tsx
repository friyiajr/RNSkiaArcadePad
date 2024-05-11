import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  Text,
  matchFont,
} from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { polar2Canvas } from "react-native-redash";

const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
const fontStyle = {
  fontFamily,
  fontSize: 14,
  fontStyle: "regular",
  fontWeight: "bold",
};
const font = matchFont(fontStyle);

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
  const path = Skia.Path.Make();

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
      } else if (oldCanvasX <= newCoords.x && oldCanvasX <= center) {
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
      readablePosition.value = distances[0].position;
    })
    .onEnd(() => {
      positionX.value = middleX;
      positionY.value = middleY;
      readablePosition.value = "NEUTRAL";
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          {/* <Path path={path} color={"black"} /> */}
          <Circle
            cx={screenWidth / 2}
            cy={screenHeight / 2}
            r={125}
            color={"black"}
          />
          <Circle cx={positionX} cy={positionY} r={40} color={"red"} />
          <Text
            x={middleX - 20}
            y={screenHeight}
            text={readablePosition}
            font={font}
            color={"black"}
          />
        </Canvas>
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
    backgroundColor: "grey",
    width: screenWidth,
    height: screenHeight,
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
