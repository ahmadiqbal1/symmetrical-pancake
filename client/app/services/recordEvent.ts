import { axios } from "@/services/axios";
import { debounce, extend } from "lodash";

let events: any = [];

const post = debounce(() => {
  const eventsToSend = events;
  events = [];

  axios.post("api/events", eventsToSend);
}, 1000);

export default function recordEvent(action: any, objectType: any, objectId: any, additionalProperties: any) {
  const event = {
    action,
    object_type: objectType,
    object_id: objectId,
    timestamp: Date.now() / 1000.0,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
  };
  extend(event, additionalProperties);
  events.push(event);

  post();
}
