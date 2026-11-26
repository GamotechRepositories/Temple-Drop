package com.templedrop.security;

import com.templedrop.model.UserDocument;
import org.bson.types.ObjectId;

public record AuthenticatedUser(UserDocument user, ObjectId userObjectId) {}
