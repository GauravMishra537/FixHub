package com.fixhub.resource.controller;

import com.fixhub.common.dto.ApiResponse;
import com.fixhub.resource.dto.ApproverDto;
import com.fixhub.resource.dto.ApproverRequestDto;
import com.fixhub.resource.dto.CategoryDto;
import com.fixhub.resource.dto.CategoryRequestDto;
import com.fixhub.resource.dto.ItemDto;
import com.fixhub.resource.dto.ItemRequestDto;
import com.fixhub.resource.dto.MemberDto;
import com.fixhub.resource.service.ResourceCatalogService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Admin only. /api/admin/** is already protected. */
@RestController
@RequestMapping("/api/admin/resources")
public class ResourceAdminController {

    private final ResourceCatalogService catalogService;

    public ResourceAdminController(ResourceCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    // ---------- categories ----------

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listCategories()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@RequestBody CategoryRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category added", catalogService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(@PathVariable Long id,
                                                                   @RequestBody CategoryRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Category saved", catalogService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        catalogService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category removed", null));
    }

    // ---------- items ----------

    @GetMapping("/categories/{id}/items")
    public ResponseEntity<ApiResponse<List<ItemDto>>> items(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listItems(id)));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<ItemDto>> createItem(@RequestBody ItemRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added", catalogService.createItem(request)));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<ItemDto>> updateItem(@PathVariable Long id,
                                                           @RequestBody ItemRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Item saved", catalogService.updateItem(id, request)));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        catalogService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success("Item removed", null));
    }

    // ---------- approvers ----------

    @GetMapping("/approvers")
    public ResponseEntity<ApiResponse<List<ApproverDto>>> approvers() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listApprovers()));
    }

    @PutMapping("/approvers/{departmentId}")
    public ResponseEntity<ApiResponse<ApproverDto>> setApprover(@PathVariable Long departmentId,
                                                                @RequestBody ApproverRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success("Approver saved",
                catalogService.setApprover(departmentId, request == null ? null : request.userId())));
    }

    @DeleteMapping("/approvers/{departmentId}")
    public ResponseEntity<ApiResponse<Void>> clearApprover(@PathVariable Long departmentId) {
        catalogService.clearApprover(departmentId);
        return ResponseEntity.ok(ApiResponse.success("Approver cleared", null));
    }

    // people of one department, for the approver dropdown
    @GetMapping("/departments/{departmentId}/members")
    public ResponseEntity<ApiResponse<List<MemberDto>>> members(@PathVariable Long departmentId) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.listMembers(departmentId)));
    }
}