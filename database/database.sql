-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (x86_64)
--
-- Host: turntable.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `items`
--

CREATE TABLE IF NOT EXISTS railway;
USE railway;

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `wishlist_id` int DEFAULT NULL,
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `store_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_purchased` tinyint(1) DEFAULT '0',
  `purchased_at` datetime DEFAULT NULL,
  `purchased_price` decimal(10,2) DEFAULT NULL,
  `track_price` tinyint(1) DEFAULT '1',
  `saved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `purchased_by` int DEFAULT NULL,
  `purchase_source` enum('cart','wishlist') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'wishlist',
  PRIMARY KEY (`item_id`),
  KEY `idx_items_wishlist` (`wishlist_id`),
  KEY `idx_items_user` (`user_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `items_ibfk_2` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`wishlist_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (2,2,NULL,'EBONY WOOD EDP 30 ML (1.01 FL. OZ).',29.90,'https://www.zara.com/us/en/ebony-wood-edp-30ml--1-01-fl--oz---p20110784.html?v1=495703251&v2=2420306','https://static.zara.net/assets/public/5db4/8ce7/d9af4e018c05/498d1b47f0f7/20110784999-e20/20110784999-e20.jpg?ts=1774532364962&w=560','www.zara.com','\n[5/1/2026, 11:28:19 PM]: very woody scent\n[5/1/2026]: buy for mom\'s bday',1,'2026-05-02 16:38:45',29.90,1,'2026-04-27 20:47:44','2026-05-02 20:38:45','General',NULL,'wishlist'),(6,2,2,'UO Lucy Satin Ballet Flats',5.00,'https://www.urbanoutfitters.com/shop/uo-lucy-satin-ballet-flat?color=020&type=REGULAR','https://images.urbndata.com/is/image/UrbanOutfitters/98626336_020_b','www.urbanoutfitters.com','\n[5/1/2026, 11:17:51 PM]: run kinda big\n[5/1/2026, 11:28:00 PM]: get the brown ones \n[5/3/2026]: buy before the 15th',1,'2026-05-10 04:18:11',5.00,1,'2026-04-27 20:51:11','2026-05-10 04:18:11','General',2,'wishlist'),(7,2,NULL,'UO Petal Kitten Heel Sandals',45.00,'https://www.urbanoutfitters.com/shop/uo-petal-kitten-heel-sandal?color=001&type=REGULAR','https://images.urbndata.com/is/image/UrbanOutfitters/106846686_001_b?$xlarge$&fit=constrain&qlt=80&wid=640','www.urbanoutfitters.com','\n[5/1/2026, 11:17:11 PM]: run small',1,'2026-05-01 23:17:20',45.00,1,'2026-04-28 01:22:03','2026-05-02 18:45:35','General',NULL,'wishlist'),(8,2,NULL,'Whitening Toothbrush (Pink, 6 Count) - Premium Soft Dual-Tension Bristles. Advanced Plaque Removal, Stain Reduction.',3.40,'https://www.amazon.com/Euthymol-Whitening-Toothbrush-Pink-Count/dp/B0CZNWLZNY/?_encoding=UTF8&pd_rd_w=v9IVN&content-id=amzn1.sym.7826c201-7f9a-4d42-8422-30b7bd4b7d97&pf_rd_p=7826c201-7f9a-4d42-8422-30b7bd4b7d97&pf_rd_r=08496JKQGKCMAW7A02VJ&pd_rd_wg=qeZ4R&pd_rd_r=b30e60d1-6622-4f9c-b662-befb18c93b08&th=1','https://m.media-amazon.com/images/I/71Y0mHxygaL._AC_SX679_PIbundle-6,TopRight,0,0_SH20_.jpg','www.amazon.com','[5/4/2026]: 5 pack\n[5/4/2026]: 5 pack',0,NULL,NULL,1,'2026-05-04 04:17:25','2026-05-05 00:05:37','General',NULL,'wishlist'),(9,2,2,'Women\'s Betsy Clog Mule Flats - Universal Thread™',9.99,'https://www.target.com/p/women-s-betsy-clog-mule-flats-universal-thread/-/A-88021436#lnk=sametab','https://target.scene7.com/is/image/Target/GUEST_c9d2c2d1-e687-4ea2-8db2-b78309837a76','www.target.com','runs big\n[5/4/2026]: buy for birthday\n[5/4/2026]: buy for birthday',1,'2026-05-05 22:21:52',9.99,1,'2026-05-04 04:22:41','2026-05-06 02:21:52','General',2,'wishlist'),(10,2,NULL,'The Ordinary Glycolic Acid 7% Exfoliating Toner, Brightening and Smoothing Daily Toner for More Even-Looking Skin Tone',9.00,'https://www.amazon.com/Ordinary-Exfoliating-Brightening-Smoothing-Even-Looking/dp/B0DMTDN158/?_encoding=UTF8&pd_rd_w=Z3ZTV&content-id=amzn1.sym.05641e1e-c79b-4940-8d46-ca026cfcda34&pf_rd_p=05641e1e-c79b-4940-8d46-ca026cfcda34&pf_rd_r=1EJ3MBKTWWMKCY7V720H&pd_rd_wg=cPPhW&pd_rd_r=2a9bbdab-69bd-4b15-ab6c-a2662740ce92&th=1','https://m.media-amazon.com/images/I/51maLJWzPyL._SX522_.jpg','www.amazon.com',NULL,1,'2026-05-10 21:03:26',9.00,1,'2026-05-04 19:53:24','2026-05-10 21:03:26','General',2,'wishlist'),(11,2,4,'14k Gold Dipped Lab-Grown Diamond Cross Twist Chain Pendant Necklace - Gold',20.00,'https://www.target.com/p/14k-gold-dipped-lab-grown-diamond-cross-twist-chain-pendant-necklace-gold/-/A-94988931#lnk=sametab','https://target.scene7.com/is/image/Target/GUEST_1c1dd7a5-1a5c-4248-ade0-f98ba70f3441','www.target.com','[5/5/2026]: buy in person',1,'2026-05-10 23:36:09',20.00,1,'2026-05-05 01:10:49','2026-05-10 23:36:09','General',3,'wishlist'),(12,2,3,'East Of Eden: (Penguin Orange Collection)',18.34,'https://www.ebay.com/itm/196049711536?_skw=east+of+eden&epid=219235849&itmmeta=01KQTVCVA1E31BG4AFFK11YM26&hash=item2da57931b0:g:unMAAOSwxzllOVAI&itmprp=enc%3AAQALAAAA0GfYFPkwiKCW4ZNSs2u11xAPCII%2Fr9ociEeKBsXkwX2HTEUWLK92Z1jB3XFqTeZe90hP1AjFsK5ZcKru5qDc3rVBvY7ev%2BC9W1Hgt%2FfVX5plfhWevpdKeHiU3%2FGhoGmNPbXRX3X4znEZHxUjIn%2ByTTzks5Pvg5anFQ%2BBjYn18rkBRNMSsVrlQivutpKKxlaeWWnUI6j1UjHLNmhIymuAdukbFsAULxgYSKHKO5ERmUqdSpHWkXQR0brgoXC16QqJor1mASE%2FFBx%2FgDMKR2S94Qs%3D%7Ctkp%3ABk9SR5y1s9u-Zw','https://i.ebayimg.com/images/g/unMAAOSwxzllOVAI/s-l1600.jpg','www.ebay.com',NULL,0,NULL,NULL,1,'2026-05-05 01:18:22','2026-05-05 01:18:22','General',NULL,'wishlist'),(13,2,4,'Contour Face LED Mask',345.00,'https://www.nordstrom.com/s/contour-face-led-mask-nordstrom-exclusive/8449461?origin=category-personalizedsort&breadcrumb=Home%2FBeauty%2FSkin%20Care%2FTools%20%26%20Devices&color=000','https://n.nordstrommedia.com/it/eebc77bb-33cd-4919-9f77-423bdf5a7a1c.jpeg?trim=color&w=350&h=536','www.nordstrom.com','[5/5/2026]: sale starts on may 8th',1,'2026-05-10 23:36:30',345.00,1,'2026-05-05 14:13:52','2026-05-10 23:36:30','General',3,'wishlist'),(14,2,3,'Billie Eilish Eau de Parfum Spray Perfume for Women, Notes of Sugared Petals, Vanilla & Musk',54.59,'https://www.amazon.com/Billie-Eilish-Eau-Parfum-Pack/dp/B09MZXJ9GW/?_encoding=UTF8&pd_rd_w=1u03T&content-id=amzn1.sym.048a6e3c-8d40-4302-8312-26c626af6738%3Aamzn1.symc.050ea944-f1cf-4610-b462-3b604f2f4082&pf_rd_p=048a6e3c-8d40-4302-8312-26c626af6738&pf_rd_r=46X5ASXT49WEN2B67GB6&pd_rd_wg=1clGr&pd_rd_r=b802ffa2-20fb-4807-b44f-2bc1660be386&th=1','https://m.media-amazon.com/images/I/519+yDIoYJL._SX522_.jpg','www.amazon.com','[{\"id\":\"1778014396576-kocgh8\",\"user\":\"darcie13\",\"created_at\":\"2026-05-05T20:53:16.576Z\",\"text\":\"buy it during the amazon spring sale\"}]',0,NULL,NULL,1,'2026-05-05 19:50:06','2026-05-05 20:53:16','General',NULL,'wishlist'),(15,2,3,'14-inch MacBook Pro - Apple M5 chip with 10-core CPU and 10-core GPU - 16GB Memory - 512GB SSD - Space Black',1449.00,'https://www.bestbuy.com/product/14-inch-macbook-pro-apple-m5-chip-with-10-core-cpu-and-10-core-gpu-16gb-memory-512gb-ssd-space-black/JJGCQL8GYV','https://pisces.bbystatic.com/image2/BestBuy_US/images/products/653a22d9-0889-442e-9f67-7ee03a92ffe5.jpg;maxHeight=128;maxWidth=64?format=webp','www.bestbuy.com',NULL,0,NULL,NULL,1,'2026-05-05 20:03:02','2026-05-05 20:03:02','General',NULL,'wishlist'),(25,2,2,'PLAYING TORTOISE',109.95,'https://www.stevemadden.com/collections/womens-wedges/products/playing-tortoise','https://www.stevemadden.com/cdn/shop/files/STEVEMADDEN_SHOES_PLAYING_TORTOISE01.jpg?v=1773940728&width=1920','www.stevemadden.com',NULL,1,'2026-05-10 18:36:16',109.95,1,'2026-05-10 18:12:53','2026-05-10 18:36:16','General',2,'wishlist'),(26,2,3,'Good Kitty INSTAX MINI Ceramic Picture Frame Vase',19.00,'https://www.urbanoutfitters.com/shop/good-kitty-instax-mini-ceramic-picture-frame-vase?color=040','https://images.urbndata.com/is/image/UrbanOutfitters/104024369_040_b?$xlarge$&fit=constrain&qlt=80&wid=640','www.urbanoutfitters.com',NULL,0,NULL,NULL,1,'2026-05-10 18:25:16','2026-05-10 18:25:16','General',NULL,'wishlist'),(27,2,2,'Apology Black Pu Knee High Block Heel Boots',30.00,'https://www.publicdesire.com/products/apology-black-pu-knee-high-block-heel-boots?s_cdt=260510&s_lid=6328426728779204&s_ln=shoes&s_uid=615928df-6fa8-4427-82bc-89d533326759','https://www.publicdesire.com/cdn/shop/files/APOLOGYMATT-1_99c882e4-8b0a-465b-8896-3ab66bebdc6c.jpg?v=1761305139&width=1920','www.publicdesire.com',NULL,1,'2026-05-10 19:57:14',30.00,1,'2026-05-10 18:33:09','2026-05-10 19:57:14','General',3,'wishlist'),(28,2,2,'High Heel Stiletto Platform Pumps',53.99,'https://www.dreampairs.com/products/swan_30?color=1906','https://cdnimg.dreampairs.com/dreampairshoes/product/product/SWAN_30/BLACK PAT/1.jpg','www.dreampairs.com',NULL,1,'2026-05-10 20:25:53',53.99,1,'2026-05-10 18:35:30','2026-05-10 20:25:53','General',2,'wishlist'),(29,2,2,'Sambae Shoes',66.00,'https://www.adidas.com/us/sambae-shoes/JI1350.html?cm_mmc=AdieSEM_Feeds-_-GoogleProductAds-_-NA-_-JI1350&cm_mmca1=US&cm_mmca2=NA&kpid=JI1350&sourceid=543457011','https://assets.adidas.com/images/w_600,f_auto,q_auto/b9ff367c75b24680bf46fc64786d950d_9366/Sambae_Shoes_Black_JI1350_01_standard.jpg','www.adidas.com',NULL,1,'2026-05-10 20:12:47',66.00,1,'2026-05-10 20:12:04','2026-05-10 20:12:47','General',2,'wishlist'),(30,2,2,'LARINA BLUE SATIN',119.95,'https://www.stevemadden.com/products/larina-blue-satin','https://www.stevemadden.com/cdn/shop/files/STEVEMADDEN_SHOES_LARINA_BLUE-SATIN_01_7effbee0-7888-4db5-9932-91f58571f7ed.jpg?v=1772470597&width=1920','www.stevemadden.com',NULL,1,'2026-05-10 20:56:44',119.95,1,'2026-05-10 20:55:29','2026-05-10 20:56:44','General',2,'wishlist'),(31,2,2,'VELVET EFFECT BUCKLE BALLET FLATS',55.90,'https://www.zara.com/us/en/velvet-effect-buckle-ballet-flats-p13566610.html?v1=495680641','https://static.zara.net/assets/public/33ec/0be3/ef4d425b9989/af00b4a604e5/13566610800-p/13566610800-p.jpg?ts=1764062596380&w=1920','www.zara.com',NULL,1,'2026-05-10 21:29:33',55.90,1,'2026-05-10 21:28:17','2026-05-10 21:29:33','General',2,'wishlist'),(32,2,2,'PATENT EFFECT HEELED SANDALS',49.90,'https://www.zara.com/us/en/patent-effect-heeled-sandals-p12372510.html?v1=495707321','https://static.zara.net/assets/public/e542/bb2a/71184a9cabd0/dbae45123d89/12318510800-p/12318510800-p.jpg?ts=1738327492396&w=1920','www.zara.com','[5/10/2026]: get a size up',1,'2026-05-10 22:03:42',49.90,1,'2026-05-10 21:59:40','2026-05-10 22:03:42','General',2,'wishlist');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email_sent` tinyint(1) DEFAULT '0',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notifications_user` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (66,2,'darcie13 purchased \"Apology Black Pu Knee High Block Heel Boots\" from \"shoes\".',0,'2026-05-10 19:57:18',0,'collaboration_activity',2),(71,1,'darcieray purchased \"VELVET EFFECT BUCKLE BALLET FLATS\" from \"shoes\".',0,'2026-05-10 21:29:33',0,'collaboration_activity',2),(72,3,'darcieray purchased \"VELVET EFFECT BUCKLE BALLET FLATS\" from \"shoes\".',0,'2026-05-10 21:29:38',0,'collaboration_activity',2),(73,1,'darcieray purchased \"PATENT EFFECT HEELED SANDALS\" from \"shoes\".',0,'2026-05-10 22:03:42',0,'collaboration_activity',2),(74,3,'darcieray purchased \"PATENT EFFECT HEELED SANDALS\" from \"shoes\".',0,'2026-05-10 22:03:47',0,'collaboration_activity',2),(75,2,'darcie13 purchased \"14k Gold Dipped Lab-Grown Diamond Cross Twist Chain Pendant Necklace - Gold\" from \"mother\'s day\".',0,'2026-05-10 23:36:09',0,'collaboration_activity',4),(76,2,'darcie13 purchased \"Contour Face LED Mask\" from \"mother\'s day\".',0,'2026-05-10 23:36:30',0,'collaboration_activity',4);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_history`
--

DROP TABLE IF EXISTS `price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `price_history_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_history`
--

LOCK TABLES `price_history` WRITE;
/*!40000 ALTER TABLE `price_history` DISABLE KEYS */;
INSERT INTO `price_history` VALUES (1,6,55.00,'2026-04-15 14:00:00'),(2,6,48.50,'2026-04-20 16:00:00'),(3,6,45.00,'2026-05-02 02:30:00'),(4,8,23.40,'2026-05-04 04:17:25'),(5,9,29.99,'2026-05-04 04:22:41'),(6,6,35.00,'2026-05-04 06:59:21'),(7,8,13.40,'2026-05-04 06:59:21'),(8,9,19.99,'2026-05-04 06:59:21'),(9,6,25.00,'2026-05-04 06:59:50'),(10,8,3.40,'2026-05-04 06:59:50'),(11,9,9.99,'2026-05-04 06:59:50'),(12,6,15.00,'2026-05-04 07:04:00'),(13,8,-6.60,'2026-05-04 07:04:00'),(14,9,-0.01,'2026-05-04 07:04:00'),(15,6,5.00,'2026-05-04 07:05:00'),(16,8,-16.60,'2026-05-04 07:05:00'),(17,9,-10.01,'2026-05-04 07:05:00'),(18,6,-5.00,'2026-05-04 07:06:00'),(19,8,-26.60,'2026-05-04 07:06:00'),(20,9,-20.01,'2026-05-04 07:06:00'),(21,6,-15.00,'2026-05-04 07:07:00'),(22,8,-36.60,'2026-05-04 07:07:00'),(23,9,-30.01,'2026-05-04 07:07:00'),(24,6,-25.00,'2026-05-04 07:08:00'),(25,8,-46.60,'2026-05-04 07:08:00'),(26,9,-40.01,'2026-05-04 07:08:00'),(27,6,-35.00,'2026-05-04 07:09:00'),(28,8,-56.60,'2026-05-04 07:09:00'),(29,9,-50.01,'2026-05-04 07:09:00'),(30,6,-45.00,'2026-05-04 07:10:00'),(31,8,-66.60,'2026-05-04 07:10:00'),(32,9,-60.01,'2026-05-04 07:10:00'),(33,6,-55.00,'2026-05-04 07:11:00'),(34,8,-76.60,'2026-05-04 07:11:00'),(35,9,-70.01,'2026-05-04 07:11:00'),(36,6,-65.00,'2026-05-04 07:11:39'),(37,8,-86.60,'2026-05-04 07:11:41'),(38,9,-80.01,'2026-05-04 07:11:42'),(39,6,-75.00,'2026-05-04 07:12:00'),(40,8,-96.60,'2026-05-04 07:12:00'),(41,9,-90.01,'2026-05-04 07:12:00'),(42,6,-85.00,'2026-05-04 07:13:00'),(43,8,-106.60,'2026-05-04 07:13:00'),(44,9,-100.01,'2026-05-04 07:13:00'),(45,6,-95.00,'2026-05-04 07:14:00'),(46,8,-116.60,'2026-05-04 07:14:00'),(47,9,-110.01,'2026-05-04 07:14:00'),(48,6,-105.00,'2026-05-04 07:24:12'),(49,8,-126.60,'2026-05-04 07:24:14'),(50,9,-120.01,'2026-05-04 07:24:16'),(51,10,9.00,'2026-05-04 19:53:24'),(52,11,20.00,'2026-05-05 01:10:49'),(53,12,18.34,'2026-05-05 01:18:22'),(54,13,345.00,'2026-05-05 14:13:52'),(55,14,54.59,'2026-05-05 19:50:06'),(56,15,1449.00,'2026-05-05 20:03:02'),(57,25,109.95,'2026-05-10 18:12:53'),(58,26,19.00,'2026-05-10 18:25:17'),(59,27,30.00,'2026-05-10 18:33:09'),(60,28,53.99,'2026-05-10 18:35:31'),(61,29,66.00,'2026-05-10 20:12:04'),(62,30,119.95,'2026-05-10 20:55:29'),(63,31,55.90,'2026-05-10 21:28:17'),(64,32,49.90,'2026-05-10 21:59:40');
/*!40000 ALTER TABLE `price_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `share_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `share_token` (`share_token`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'darcie','darcie@example.com','$2b$10$zHWpV0WPj7zCOwiO8NSXFesPcIc9ewBcf9zhNwYd1xm3sMZJN6pna','2026-04-21 21:27:27','e7c0781f11d60427f3631b164b920e48',NULL,NULL),(2,'darcieray','dray@gmail.com','$2a$10$VgULXasg3JWP4TIHKtBg2eJTSHolL2ue6SoHZSciUB1FGIs4qFDgW','2026-04-21 22:08:15','cart-shared-v1-unique-id-826',NULL,NULL),(3,'darcie13','dreyray456@gmail.com','$2b$10$lWrIikAiPirpmSsDbQI7w.tqNiq6fPF4leHSl86ngusN37tUYq9tu','2026-05-02 02:16:31','7ff092a2ed4bcef10edb1ed5b1cb8346','4a49a2e2f3575cc6b553f11d643bcd3ad207f73e5161005391ca5c9d9eac4798','2026-05-10 20:24:49');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist_members`
--

DROP TABLE IF EXISTS `wishlist_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_members` (
  `member_id` int NOT NULL AUTO_INCREMENT,
  `wishlist_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('owner','editor','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'editor',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  KEY `wishlist_id` (`wishlist_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wishlist_members_ibfk_1` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`wishlist_id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_members`
--

LOCK TABLES `wishlist_members` WRITE;
/*!40000 ALTER TABLE `wishlist_members` DISABLE KEYS */;
INSERT INTO `wishlist_members` VALUES (1,2,1,'editor','2026-04-30 23:35:57'),(2,2,1,'editor','2026-04-30 23:52:39'),(3,2,1,'editor','2026-05-01 00:24:17'),(4,2,1,'editor','2026-05-01 00:35:07'),(6,2,2,'owner','2026-05-01 01:26:16'),(8,2,3,'editor','2026-05-02 02:18:09'),(9,2,3,'editor','2026-05-02 02:23:41'),(13,3,2,'owner','2026-05-03 21:54:46'),(14,3,3,'editor','2026-05-03 22:42:00'),(15,2,3,'editor','2026-05-04 19:50:02'),(16,4,2,'owner','2026-05-05 01:09:51'),(17,4,3,'editor','2026-05-10 05:28:28');
/*!40000 ALTER TABLE `wishlist_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
  `wishlist_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_archived` tinyint(1) DEFAULT '0',
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  PRIMARY KEY (`wishlist_id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
INSERT INTO `wishlists` VALUES (2,2,'shoes','2026-04-27 16:02:37',1,1,'2026-05-10 22:03:48','2026-05-10 22:03:54'),(3,2,'birthday','2026-05-03 21:54:46',0,0,NULL,NULL),(4,2,'mother\'s day','2026-05-05 01:09:51',1,1,'2026-05-10 23:36:34','2026-05-10 23:36:46');
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-10 19:50:17
