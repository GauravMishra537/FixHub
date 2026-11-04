package com.fixhub.resource.service.impl;

import com.fixhub.resource.entity.ItemKind;
import com.fixhub.resource.entity.ResourceItem;
import com.fixhub.resource.repository.ResourceRequestRepository;
import com.fixhub.resource.service.ResourceStockService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ResourceStockServiceImpl implements ResourceStockService {

    private final ResourceRequestRepository requestRepository;

    public ResourceStockServiceImpl(ResourceRequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    @Override
    public Long available(ResourceItem item) {
        if (item.getKind() != ItemKind.PHYSICAL || item.getTotalStock() == null) {
            return null;
        }
        long held = requestRepository.heldQuantity(item.getId());
        return item.getTotalStock() - held;
    }

    @Override
    public void require(ResourceItem item, int quantity) {
        Long left = available(item);
        if (left == null) {
            return;
        }
        if (left <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, item.getName() + " is out of stock");
        }
        if (quantity > left) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only " + left + " of " + item.getName() + " left. You asked for " + quantity);
        }
    }
}