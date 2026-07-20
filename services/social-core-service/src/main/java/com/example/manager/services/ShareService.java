package com.example.manager.services;

import com.example.manager.dto.requests.share.ShareRequest;
import com.example.manager.dto.responses.post.PostResponse;
import com.example.manager.dto.responses.share.ShareResponse;
import com.example.manager.models.PostEntity;
import com.example.manager.models.ShareEntity;
import com.example.manager.models.UserEntity;
import com.example.manager.repositories.PostRepository;
import com.example.manager.repositories.ShareRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ShareService {
    @Autowired
    private ShareRepository shareRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostService postService;


    public ShareResponse createShare(ShareRequest shareRequest){
        UserEntity user = userService.getUserById(shareRequest.getUserId());
        PostEntity post = postRepository.findById(shareRequest.getPostId())
                .orElseThrow(() -> new RuntimeException("Không có bài viết "+shareRequest.getPostId()));

        // entity
        ShareEntity share = new ShareEntity();
        share.setUser(user);
        share.setPost(post);
        shareRepository.save(share);

        //response
        return this.convertShareResponse(share);
    }

    public Page<ShareResponse> getShareByUser(String userId,int page,int size){
        Pageable pageable = PageRequest.of(page,size);
        Page<ShareEntity> shares = shareRepository.getAllShareByUserId(userId,pageable);
        return shares.map(this::convertShareResponse);
    }

    public ShareResponse convertShareResponse(ShareEntity shareEntity){
        PostResponse postResponse = postService.getItemPost(shareEntity.getPost().getPostId());
        ShareResponse shareResponse = new ShareResponse();
        shareResponse.setPost(postResponse);
        shareResponse.setShareId(shareEntity.getShareId());
        return shareResponse;
    }

    public Boolean deleteShare(String shareId){
        ShareEntity shareEntity = shareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài share có id "+shareId));
        shareRepository.delete(shareEntity);
        return true;
    }
}
