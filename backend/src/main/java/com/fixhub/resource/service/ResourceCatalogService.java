package com.fixhub.resource.service;

import com.fixhub.resource.dto.ApproverDto;
import com.fixhub.resource.dto.CategoryDto;
import com.fixhub.resource.dto.CategoryRequestDto;
import com.fixhub.resource.dto.ItemDto;
import com.fixhub.resource.dto.ItemRequestDto;
import com.fixhub.resource.dto.MemberDto;

import java.util.List;

/** The admin side of the catalog: categories, items with stock, and who approves for each department. */
public interface ResourceCatalogService {

    // every group followed by its sub-categories
    List<CategoryDto> listCategories();

    CategoryDto createCategory(CategoryRequestDto request);

    CategoryDto updateCategory(Long id, CategoryRequestDto request);

    void deleteCategory(Long id);

    // every item of one sub-category, hidden ones too
    List<ItemDto> listItems(Long categoryId);

    ItemDto createItem(ItemRequestDto request);

    ItemDto updateItem(Long id, ItemRequestDto request);

    void deleteItem(Long id);

    List<ApproverDto> listApprovers();

    ApproverDto setApprover(Long departmentId, Long userId);

    void clearApprover(Long departmentId);

    List<MemberDto> listMembers(Long departmentId);
}