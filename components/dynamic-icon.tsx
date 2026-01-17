import {
  Feather,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { StyleProp, ViewStyle } from "react-native";

export type IconFamily =
  | "MaterialCommunityIcons"
  | "MaterialIcons"
  | "FontAwesome5"
  | "FontAwesome"
  | "Ionicons"
  | "Feather";

interface DynamicIconProps {
  family: IconFamily;
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const iconFamilies = {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome,
  Ionicons,
  Feather,
};

export function DynamicIcon({
  family,
  name,
  size = 24,
  color = "#333",
  style,
}: DynamicIconProps) {
  const IconComponent = iconFamilies[family];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent name={name as any} size={size} color={color} style={style} />
  );
}
