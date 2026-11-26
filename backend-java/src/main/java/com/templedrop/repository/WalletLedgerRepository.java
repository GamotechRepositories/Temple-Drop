package com.templedrop.repository;

import com.templedrop.model.WalletLedgerDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WalletLedgerRepository extends MongoRepository<WalletLedgerDocument, String> {
}
