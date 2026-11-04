package com.fixhub.resource.service;

import com.fixhub.resource.entity.ResourceItem;

/** How many of an item are left. Left = total stock minus what requests hold. */
public interface ResourceStockService {

    /** Left of a PHYSICAL item. Empty for a DIGITAL item (no limit). */
    Long available(ResourceItem item);

    /** Call with the item row locked. 409 when there is not enough. Digital items always pass. */
    void require(ResourceItem item, int quantity);
}