import Fuse from "fuse.js";
import { KnowledgeDocument } from "../../models/knowledgeDocument.model.js";

export interface LocationResolution {
  resolved: boolean;
  location: string | null;
}


const LOCATION_MATCH_THRESHOLD = 0.35;

export const resolveLocation = async(
    location: string
): Promise<LocationResolution> => {
    const input = location.trim()

    if(!input) {
        return {
            resolved: false,
            location: null
        }
    }

    const locations = await KnowledgeDocument.distinct("metaData.city")

    const validLocations = locations.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
    );
    if(!validLocations.length) {
        return {
            resolved: false,
            location: null
        }
    }

    const fuse = new Fuse(validLocations, {
        threshold: LOCATION_MATCH_THRESHOLD,
        ignoreLocation: true,
    });

    const result = fuse.search(input)[0]
    if(!result) {
        return {
            resolved: false,
            location: null
        }
    }
    if(typeof result.score === "number"&& result.score > LOCATION_MATCH_THRESHOLD) {
        return {
            resolved: false,
            location: null
        }
    }
    return {
        resolved: true,
        location: result.item
    }
}