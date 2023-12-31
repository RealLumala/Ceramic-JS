import Level from "level-ts";
import { DocState, Doctype, DoctypeUtils } from "@ceramicnetwork/common"
import { StateStore } from "./state-store"
import DocID from '@ceramicnetwork/docid'

/**
 * Ceramic store for saving documents locally
 */
export class LevelStateStore implements StateStore {
    #store: Level

    constructor(private storePath: string) {
    }

    /**
     * Gets internal db
     */
    get store(): Level {
        return this.#store
    }

    /**
     * Open pinning service
     */
    async open(): Promise<void> {
        this.#store = new Level(this.storePath);
    }

    /**
     * Pin document
     * @param document - Document instance
     */
    async save(document: Doctype): Promise<void> {
        await this.#store.put(document.id.baseID.toString(), DoctypeUtils.serializeState(document.state))
    }

    /**
     * Load document
     * @param docId - Document ID
     */
    async load(docId: DocID): Promise<DocState> {
        try {
            const state = await this.#store.get(docId.baseID.toString())
            if (state) {
                return DoctypeUtils.deserializeState(state);
            } else {
                return null;
            }
        } catch (err) {
            if (err.notFound) {
                return null; // return null for non-existent entry
            }
            throw err;
        }
    }

    /**
     * Is document pinned locally?
     * @param docId - Document ID
     */
    async exists(docId: DocID): Promise<boolean> {
        const state = await this.load(docId.baseID);
        return Boolean(state)
    }

    /**
     * Unpin document
     * @param docId - Document ID
     */
    async remove(docId: DocID): Promise<void> {
        const isPresent = await this.exists(docId.baseID)
        if (isPresent) {
            await this.#store.del(docId.baseID.toString())
        }
    }

    /**
     * List pinned document
     * @param docId - Document ID
     */
    async list(docId?: DocID): Promise<string[]> {
        let docIds: string[]
        if (docId == null) {
            return this.#store.stream({ keys: true, values: false })
        } else {
            const exists = await this.exists(docId.baseID)
            docIds = exists ? [docId.toString()] : []
        }
        return docIds
    }

    /**
     * Close pinning service
     */
    async close(): Promise<void> {
        // Do Nothing
    }
}
