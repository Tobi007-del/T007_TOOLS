import { useEffect, useRef } from "react";
import { TimeTravelPlugin } from "../../plugins";
import { type TimeTravelConfig, TimeTravelOverlay as VTimeTravelOverlay } from "../vanilla/TimeTravelOverlay";
import { useISOLayoutEffect } from "./utils";

/** React props for controlling the vanilla TimeTravel overlay. */
export interface TimeTravelOverlayProps extends Partial<TimeTravelConfig> {
  /** Plugin instance controlled by this overlay bridge. */
  time: TimeTravelPlugin;
}

/** React bridge for mounting and controlling a vanilla TimeTravelOverlay instance.
 * Instantiates a `TimeTravelOverlay` for the provided plugin, tears it down on unmount, and syncs prop changes into reactive `config`.
 * Use this when your app is React but you want the overlay behavior with react-safe instance lifecycle management.
 * @param props Overlay bridge props.
 */
export function TimeTravelOverlay(props: TimeTravelOverlayProps) {
  const vRef = useRef<VTimeTravelOverlay | null>(null),
    { time, title, color = "", devOnly = true, startOpen = false, container = document.body } = props;

  useEffect(() => {
    vRef.current = new VTimeTravelOverlay(time, props);
    return () => void (vRef.current?.destroy(), (vRef.current = null));
  }, [time]);
  useISOLayoutEffect(() => void (vRef.current && (title !== undefined && (vRef.current.config.title = title), (vRef.current.config.color = color), (vRef.current.config.devOnly = devOnly), (vRef.current.config.container = container ?? document.body), (vRef.current.state.open = startOpen))), [title, color, devOnly, container, startOpen]);

  return null;
}
