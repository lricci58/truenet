<?php
include("../connection.php");

if (isset($_POST["ticker"])) $ticker = mysqli_real_escape_string($con, $_POST["ticker"]);
if (isset($_POST["platform"])) $platform = mysqli_real_escape_string($con, $_POST["platform"]);

$get_investments = "SELECT
i.`id`,
pl.`name` AS `platform`,
tl.`ticker`,
tl.`investment_type`,
tl.`name`,
i.`date`,
i.`operation`,
i.`shares`,
i.`cost_per_share`,
i.`commission`,
i.`usd_quote`
FROM `investments` AS i
LEFT JOIN `ticker_list` AS tl ON i.`ticker_id` = tl.`id`
LEFT JOIN `platform_list` AS pl ON i.`platform_id` = pl.`id`";

$get_investments .= " WHERE 1";

if (isset($ticker) && !empty($ticker)) {
    $get_investments .= " AND `ticker` = '$ticker'";
}

$get_investments .= " ORDER BY i.`date` DESC";

if (isset($platform) && !empty($platform)) {
    $get_investments .= " AND  `ticker` = '$platform'";
}
$get_investments .= ";";

$investments_result = mysqli_query($con, $get_investments);

$investments = array();
while ($row = mysqli_fetch_assoc($investments_result)) {
    $investment = array();
    $investment["id"] = $row["id"];
    $investment["platform"] = $row["platform"];
    $investment["ticker"] = $row["ticker"];
    $investment["investment_type"] = $row["investment_type"];
    $investment["name"] = $row["name"];
    $investment["date"] = $row["date"];
    $investment["operation"] = $row["operation"];
    $investment["shares"] = $row["shares"];
    $investment["cost_per_share"] = $row["cost_per_share"];
    $investment["commission"] = $row["commission"];
    $investment["usd_quote"] = $row["usd_quote"];

    array_push($investments, $investment);
}

echo json_encode($investments);
return;
